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
  tsConfigFilePath: string,
  compilerOptions: ts.CompilerOptions & { strict: true },
  outFilePath: string
): void => {
  const serverCode = analysisCode.serverCodeFromFile(
    tsConfigFilePath,
    compilerOptions
  );
  emitter.emit(serverCode, outFilePath);
};

generateMiddlewareCode(
  "./sample/tsconfig.json",
  {
    target: ts.ScriptTarget.ES2020,
    strict: true
  },
  "./out.ts"
);
console.log("ok");
