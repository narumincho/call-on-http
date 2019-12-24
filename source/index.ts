import * as ts from "typescript";

// 参考: https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API

type ServerCode = {
  functions: Map<string, Function>;
  typeDefinitions: Map<string, TypeWithDocument>;
};

type Function = {
  arguments: Map<string, Type>;
  return: Type;
};

type TypeWithDocument = {
  /** ハイライトとか@ とかの構造が残ってるやつ */
  document: Array<ts.SymbolDisplayPart>;
  typeBody: Type;
};

type Type =
  | {
      type: "object";
      members: Map<string, TypeWithDocument>;
    }
  | { type: "referenceInServerCode"; name: string }
  | { type: "primitive"; primitive: PrimitiveType }
  | { type: "union"; types: ReadonlyArray<Type> };

type PrimitiveType =
  | "string"
  | "number"
  | "boolean"
  | "undefined"
  | "null"
  | "never";

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

/**
 * TODO
 * ts.Typeからプロパティのドキュメントが取得できるなら  ts.getDeclaredTypeOfSymbol から計算された型を利用できる?
 */
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

const nodeToType = <T>(
  typeChecker: ts.TypeChecker,
  typeHeader: Map<string, T>
) => (node: ts.TypeNode): Type => {
  switch (node.kind) {
    case ts.SyntaxKind.StringKeyword:
      return {
        type: "primitive",
        primitive: "string"
      };
    case ts.SyntaxKind.NumberKeyword:
      return {
        type: "primitive",
        primitive: "number"
      };
    case ts.SyntaxKind.BooleanKeyword:
      return {
        type: "primitive",
        primitive: "boolean"
      };
    case ts.SyntaxKind.UndefinedKeyword:
      return {
        type: "primitive",
        primitive: "undefined"
      };
    case ts.SyntaxKind.NullKeyword:
      return {
        type: "primitive",
        primitive: "null"
      };
    case ts.SyntaxKind.NeverKeyword:
      return {
        type: "primitive",
        primitive: "never"
      };
  }
  if (ts.isTypeLiteralNode(node)) {
    const members: Map<
      string,
      {
        document: Array<ts.SymbolDisplayPart>;
        typeBody: Type;
      }
    > = new Map();

    for (const member of node.members) {
      if (!ts.isPropertySignature(member)) {
        throw new Error(
          "型のオブジェクトのメンバーがPropertySignatureではなかった"
        );
      }
      const memberType = member.type;
      if (memberType === undefined) {
        throw new Error("メンバーの型が不明だった");
      }
      members.set(member.name.toString(), {
        document: ((member as unknown) as {
          symbol: ts.Symbol;
        }).symbol.getDocumentationComment(typeChecker),
        typeBody: nodeToType(typeChecker, typeHeader)(memberType)
      });
    }
    return {
      type: "object",
      members: members
    };
  }
  if (ts.isTypeReferenceNode(node)) {
    const typeName = node.typeName;
    if (!ts.isIdentifier(typeName)) {
      throw new Error("名前の参照の仕方がIdentifierではなかった");
    }
    if (!typeHeader.has(typeName.text)) {
      console.log(node.getFullText());
      throw new Error(
        "型" +
          typeName.text +
          "が見つからなかった。exportで関数で参照する型はすべて直下にexportされている必要があります"
      );
    }
    return {
      type: "referenceInServerCode",
      name: typeName.text
    };
  }
  if (ts.isUnionTypeNode(node)) {
    return {
      type: "union",
      types: node.types.map(nodeToType(typeChecker, typeHeader))
    };
  }
  throw new Error("サポートされていない型の表現を受け取った");
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
 */
const symbolArrayToFunctionsAndTypesBeforeReadDeclaration = (
  symbolArray: ReadonlyArray<[ts.__String, ts.Symbol]>,
  typeChecker: ts.TypeChecker
): {
  functions: Map<
    string,
    { document: Array<ts.SymbolDisplayPart>; declaration: ts.Declaration }
  >;
  typeDefinitions: Map<
    string,
    {
      document: Array<ts.SymbolDisplayPart>;
      declaration: ts.TypeAliasDeclaration;
    }
  >;
} => {
  const functions = new Map<
    string,
    { document: Array<ts.SymbolDisplayPart>; declaration: ts.Declaration }
  >();
  const typeDefinitions = new Map<
    string,
    {
      document: Array<ts.SymbolDisplayPart>;
      declaration: ts.TypeAliasDeclaration;
    }
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
        if (!ts.isTypeAliasDeclaration(declaration)) {
          throw new Error(
            "TypeAliasのdeclarationがTypeAliasDeclarationでなかった"
          );
        }
        typeDefinitions.set(key.toString(), {
          document: symbol.getDocumentationComment(typeChecker),
          declaration: declaration
        });
        break;
      }
    }
  }
  return {
    functions: functions,
    typeDefinitions: typeDefinitions
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
  const types: Map<string, TypeWithDocument> = new Map();
  for (const [
    key,
    type
  ] of functionsAndTypesBeforeReadDeclaration.typeDefinitions) {
    type.declaration.forEachChild(child => {
      if (ts.isTypeNode(child)) {
        types.set(key, {
          document: type.document,
          typeBody: nodeToType(
            typeChecker,
            functionsAndTypesBeforeReadDeclaration.typeDefinitions
          )(child)
        });
      }
    });
  }
};

console.log(
  serverCodeFromFile("sample.ts", {
    target: ts.ScriptTarget.ES2019,
    strict: true
  })
);
