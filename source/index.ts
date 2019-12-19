import * as ts from "typescript";

const getExposedVariable = (fileName: string, option: ts.CompilerOptions) => {
  const program = ts.createProgram({
    rootNames: [fileName],
    options: option
  });
  const typeChecker = program.getTypeChecker();
  console.log(program);
};

getExposedVariable("sample.ts", {});
