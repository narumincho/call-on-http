import * as analysisCode from "./analysisCode";
import * as ts from "typescript";
import * as emitter from "./emitter";

const serverCode = analysisCode.serverCodeFromFile("./sample/sample.ts", {
  target: ts.ScriptTarget.ES2019,
  strict: true
});

emitter.emit(serverCode);
