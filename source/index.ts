import * as ts from "typescript";

// 参考: https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API

type ServerCode = {
  functions: Map<string, Function>;
  types: Map<string, Type>;
};

type Function = {
  arguments: Map<string, TypeRef>;
  return: TypeRef;
};

type Type = {
  /** ハイライトとか@ とかの構造が残ってるやつ */
  document: Array<ts.SymbolDisplayPart>;
  typeBody: TypeBody;
};

type TypeBody =
  | {
      type: TypeBodyType.Object;
      value: Array<{
        property: string;
        document: ts.SymbolDisplayPart;
        typeBody: TypeBodyType;
      }>;
    }
  | { type: TypeBodyType.Ref; index: number }
  | { type: TypeBodyType.Union; value: ReadonlyArray<TypeBody> };

const enum TypeBodyType {
  Object,
  Ref,
  Union
}

type TypeRef =
  | {
      type: "definitionInServerCode";
      index: number;
    }
  | {
      type: "primitive";
      primitiveType: PrimitiveType;
    };

type PrimitiveType = "string" | "number" | "boolean" | "undefined" | "null";

/** Serialize a symbol into a json object */
const serializeSymbol = (
  symbol: ts.Symbol,
  typeChecker: ts.TypeChecker
): {
  name: string;
  documentation: string;
  type: string;
} => {
  return {
    name: symbol.getName(),
    documentation: ts.displayPartsToString(
      symbol.getDocumentationComment(typeChecker)
    ),
    type: typeChecker.typeToString(
      typeChecker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration)
    )
  };
};

const f = (typeChecker: ts.TypeChecker) => (
  value: ts.Symbol,
  key: ts.__String
): void => {
  console.log();
  console.log(key);
  const declaration = value.valueDeclaration;
  const type = typeChecker.getTypeOfSymbolAtLocation(value, declaration);
  console.log("isClassOrInterface", type.isClassOrInterface());
  console.log("isIntersection", type.isIntersection());
  console.log("isLiteral", type.isLiteral());
  console.log("isUnion", type.isUnion());

  const flags = type.flags;

  switch (flags) {
    case ts.TypeFlags.String: {
      console.log(key.toString() + "の型はstringだ!");
      return;
    }
    case ts.TypeFlags.Object: {
      console.log(key.toString() + "の型はobjectだ!");
      const callSignatures = type.getCallSignatures();
      for (const callSignature of callSignatures) {
        const callSignatureDeclaration = callSignature.getDeclaration();
        if (callSignatureDeclaration.kind === ts.SyntaxKind.ArrowFunction) {
          for (const parameter of callSignatureDeclaration.parameters) {
            console.log(parameter.name.getText());
          }
        }

        console.log("関数呼び出しの1つの形式を見つけた");
        console.group("引数");

        // 以下のやり方は型の同一性を判別することができない、まとめきった型した取得できない
        for (const parameter of callSignature.getParameters()) {
          console.log(serializeSymbol(parameter, typeChecker));
        }
        console.groupEnd();
        const returnTypeSymbol = callSignature.getReturnType().symbol;
        if (returnTypeSymbol === undefined) {
          console.log("戻り値のシンボルが不明だった");
        } else {
          console.log("戻り値", serializeSymbol(returnTypeSymbol, typeChecker));
        }
      }
    }
  }
};

const nodeToString = (
  node: ts.Node,
  indent: number,
  typeChecker: ts.TypeChecker
): string => {
  let text = "";
  node.forEachChild(node => {
    text += "\n" + nodeToString(node, indent + 1, typeChecker);
  });
  const symbolText = ((): string => {
    const symbol = ((node as unknown) as {
      symbol: ts.Symbol | undefined;
    }).symbol;
    if (symbol === undefined) {
      return "[s?]";
    }
    return JSON.stringify(serializeSymbol(symbol, typeChecker));
  })();

  return (
    "  ".repeat(indent) +
    "(" +
    ts.SyntaxKind[node.kind] +
    "," +
    node.getText() +
    "," +
    symbolText +
    text +
    "\n" +
    "  ".repeat(indent) +
    ")"
  );
};

const declarationTo = (
  declaration: ts.Declaration,
  typeChecker: ts.TypeChecker
): void => {
  if (ts.isTypeAliasDeclaration(declaration)) {
    console.log("型を定義している");
    console.log(nodeToString(declaration, 0, typeChecker));
  }
};

/**
 * TypeScriptコンパイラ内部で使われているIteratorをArrayに変換する
 * @param tsIterator
 */
const tsIteratorToArray = <T>(tsIterator: ts.Iterator<T>): ReadonlyArray<T> => {
  const array: Array<T> = [];
  while (true) {
    const nextResult = tsIterator.next();
    if (nextResult.done) {
      return array;
    }
    array.push(nextResult.value);
  }
};

/**
 * export されるシンボルを型定義と関数定義に分ける (宣言本体は解析しない)
 * @param symbolArray
 * @param typeChecker
 */
const symbolArrayToFunctionsAndTypesBeforeReadDeclaration = (
  symbolArray: ReadonlyArray<[ts.__String, ts.Symbol]>,
  typeChecker: ts.TypeChecker
): {
  functions: Map<
    string,
    { document: Array<ts.SymbolDisplayPart>; declaration: ts.Declaration }
  >;
  types: Map<
    string,
    { document: Array<ts.SymbolDisplayPart>; declaration: ts.Declaration }
  >;
} => {
  const functions = new Map<
    string,
    { document: Array<ts.SymbolDisplayPart>; declaration: ts.Declaration }
  >();
  const types = new Map<
    string,
    { document: Array<ts.SymbolDisplayPart>; declaration: ts.Declaration }
  >();
  for (const [key, symbol] of symbolArray) {
    switch (symbol.flags) {
      case ts.SymbolFlags.BlockScopedVariable:
        functions.set(key.toString(), {
          document: symbol.getDocumentationComment(typeChecker),
          declaration: symbol.valueDeclaration
        });
        break;
      case ts.SymbolFlags.TypeAlias: {
        const declaration: ts.Declaration | undefined = symbol.declarations[0];
        if (declaration === undefined) {
          throw new Error("型定義の本体がない");
        }
        types.set(key.toString(), {
          document: symbol.getDocumentationComment(typeChecker),
          declaration: declaration
        });
        break;
      }
    }
  }
  return {
    functions: functions,
    types: types
  };
};

/**
 * ファイルからサーバーのコードを解析してコード生成に必要な情報を収集する
 * @param fileName ファイル名
 * @param compilerOptions コンパイルオプション strict: trueでないといけない
 */
const serverCodeFromFile = (
  fileName: string,
  compilerOptions: ts.CompilerOptions & { strict: true }
): ServerCode => {
  const program = ts.createProgram({
    rootNames: [fileName],
    options: compilerOptions
  });
  const sourceFile = program.getSourceFile(fileName);
  if (sourceFile === undefined) {
    throw new Error("指定したファイルをソースファイルとして認識できなかった");
  }
  if (sourceFile.isDeclarationFile) {
    throw new Error("指定したファイルが型定義ファイル(.d.ts)だった");
  }
  if (!ts.isExternalModule(sourceFile)) {
    throw new Error(
      "外部へのエクスポートされる関数があるモジュールではなかった"
    );
  }
  const typeChecker = program.getTypeChecker();
  const sourceFileSymbol = typeChecker.getSymbolAtLocation(sourceFile);
  if (sourceFileSymbol === undefined) {
    throw new Error("sourceFileがSymbolとして認識されなかった");
  }
  const sourceFileExports = sourceFileSymbol.exports;
  if (sourceFileExports === undefined) {
    throw new Error("symbolTableを取得できなかった");
  }
  const functionsAndTypesBeforeReadDeclaration = symbolArrayToFunctionsAndTypesBeforeReadDeclaration(
    tsIteratorToArray(sourceFileExports.entries()),
    typeChecker
  );
  const types: Map<string, Type> = new Map();
  for (const [key, type] of functionsAndTypesBeforeReadDeclaration.types) {
    types.set(key, {
      document: type.document,
      typeBody: type.declaration
    });
  }
};

console.log(
  serverCodeFromFile("sample.ts", {
    target: ts.ScriptTarget.ES2019,
    strict: true
  })
);
