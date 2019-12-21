import * as ts from "typescript";

// 参考: https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API

/** Serialize a symbol into a json object */
const serializeSymbol = (symbol: ts.Symbol, typeChecker: ts.TypeChecker) => {
  return {
    name: symbol.getName(),
    documentation: ts.displayPartsToString(
      symbol.getDocumentationComment(typeChecker)
    ),
    type: typeChecker.typeToString(
      typeChecker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration!)
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
  // type flagが object だからオブジェクトのフィールドとして (): があるかもしれない

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
        console.log("関数呼び出しの1つの形式を見つけた");
        console.group("引数");

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
      // const pattern = type.pattern;
      // console.log("pattern", pattern);
      // if (pattern === undefined) {
      //   console.log("pattern is undef");
      //   return;
      // }
      // console.log("kd", ts.SyntaxKind[pattern.kind]);
    }
  }
};

const getExposedVariable = (
  fileName: string,
  option: ts.CompilerOptions
): void => {
  const program = ts.createProgram({
    rootNames: [fileName],
    options: option
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
    console.log("symbolTableを取得できなかった");
    return;
  }
  symbolTable.forEach(f(typeChecker));
};

getExposedVariable("sample.ts", {
  target: ts.ScriptTarget.ES2019
});
