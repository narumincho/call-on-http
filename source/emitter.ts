import * as type from "./type";
import * as generator from "js-ts-code-generator";
import * as fs from "fs";
import { expr, typeExpr } from "js-ts-code-generator";

export const emit = (
  serverCode: type.ServerCode,
  outFileName: string
): Promise<void> =>
  new Promise((resolve, reject) => {
    const expressModule = generator.createImportNodeModule<
      ["Request", "Response"],
      []
    >("express", ["Request", "Response"], []);

    const middleware = generator.exportFunction({
      name: "middleware",
      parameterList: [
        {
          name: "request",
          document: "リクエスト",
          typeExpr: expressModule.typeList.Request
        },
        {
          name: "response",
          document: "レスポンス",
          typeExpr: expressModule.typeList.Response
        }
      ],
      returnType: null,
      statementList: [
        expr.variableDefinition(
          typeExpr.union([typeExpr.typeString, typeExpr.typeUndefined]),
          expr.get(expr.get(expr.argument(0, 0), "headers"), "accept")
        ),
        expr.ifStatement(
          expr.logicalAnd(
            expr.notEqual(expr.localVariable(0, 0), expr.undefinedLiteral),
            expr.callMethod(expr.localVariable(0, 0), "includes", [
              expr.literal("text/html")
            ])
          ),
          [
            expr.evaluateExpr(
              expr.callMethod(expr.argument(1, 1), "setHeader", [
                expr.literal("content-type"),
                expr.literal("text/html")
              ])
            ),
            expr.evaluateExpr(
              expr.callMethod(expr.argument(1, 1), "send", [
                expr.literal("htmlをリクエストした")
              ])
            ),
            expr.returnVoidStatement
          ]
        ),
        expr.evaluateExpr(
          expr.callMethod(expr.argument(0, 1), "send", [
            expr.literal("APIのレスポンス")
          ])
        )
      ],
      document: "ミドルウェア"
    });

    const nodeJsCode: generator.NodeJsCode = {
      exportTypeAliasList: [],
      exportFunctionList: [middleware]
    };
    fs.writeFile(
      outFileName,
      generator.toNodeJsCodeAsTypeScript(nodeJsCode),
      () => {
        resolve();
      }
    );
  });
