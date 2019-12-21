import * as ts from "typescript";

// 参考: https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API

const visit = (node: ts.Node): void => {
  // if (ts.isStringLiteral(node)) {
  //   console.log(node.text);
  // }
  node.forEachChild(visit);
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
  symbolTable.forEach((value, key) => {
    console.log(key);
    const declaration = value.valueDeclaration;
    const flags = typeChecker.getTypeOfSymbolAtLocation(value, declaration)
      .flags;
    console.log("flags = ", flags);
    switch (flags) {
      case ts.TypeFlags.String:
        console.log(key.toString() + "の型はstringだ!");
    }
    console.log();
    declaration.forEachChild(visit);
  });
};

getExposedVariable("sample.ts", {
  target: ts.ScriptTarget.ES2019
});
