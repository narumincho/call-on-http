import * as ts from "typescript";

// 参考: https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API

type ServerCode = {
  functions: Array<Function>;
  types: Array<Type>;
};

type Function = {
  name: string;
  arguments: Array<Argument>;
  return: TypeRef;
};

type Argument = {
  name: string;
  typeRef: TypeRef;
};

type Type = {
  name: string;
  /** ハイライトとか@ とかの構造が残ってるやつ */
  doc: Array<ts.SymbolDisplayPart>;
  typeBody: Map<string, Type>;
};

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
  const typeChecker = program.getTypeChecker();

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
  const symbolTable = ((sourceFile as unknown) as { symbol: ts.Symbol }).symbol
    .exports;
  if (symbolTable === undefined) {
    throw new Error("symbolTableを取得できなかった");
  }
  tsIteratorToArray(symbolTable.entries()).map(([key, symbol]): void => {
    console.log(key, serializeSymbol(symbol, typeChecker));
  });
};

serverCodeFromFile("sample.ts", {
  target: ts.ScriptTarget.ES2019,
  strict: true
});
