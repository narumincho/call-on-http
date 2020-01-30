import * as analysisCode from "./analysisCode";
import * as ts from "typescript";
import * as emitter from "./emitter";

/**
 *
 * @param inputFileName
 * @param compilerOptions
 * @param outFilePath
 */
export const generateMiddlewareCode = (
  apiName: string,
  fileName: string,
  compilerOptions: ts.CompilerOptions & { strict: true },
  outFilePath: string
): void => {
  const serverCode = analysisCode.serverCodeFromFile(
    apiName,
    fileName,
    compilerOptions
  );
  emitter.emit(serverCode, outFilePath);
};

generateMiddlewareCode(
  "sample",
  "./sample/sample.ts",
  {
    target: ts.ScriptTarget.ES2020,
    strict: true
  },
  "./sample/out.ts"
);
console.log("ok");
