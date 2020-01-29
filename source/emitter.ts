import * as type from "./type";
import * as generator from "jstscodegenerator";
import * as fs from "fs";
import { expr, typeExpr } from "jstscodegenerator";

export const emit = (
  serverCode: type.ServerCode,
  outFileName: string
): Promise<void> =>
  new Promise((resolve, reject) => {
    const expressModule = generator.createImportNodeModule<
      ["Request", "Response"],
      []
    >("express", ["Request", "Response"], []);
    const nodeJsCode: generator.NodeJsCode = {
      exportTypeAliasList: [],
      exportFunctionList: [
        {
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
              expr.getProperty(
                expr.getProperty(expr.argument(0, 0), "headers"),
                "accept"
              )
            ),
            expr.ifStatement(
              expr.logicalAnd(
                expr.notEqual(expr.localVariable(0, 0), expr.undefinedLiteral),
                expr.call(
                  expr.getProperty(expr.localVariable(0, 0), "includes"),
                  [expr.stringLiteral("text/html")]
                )
              ),
              [
                expr.evaluateExpr(
                  expr.call(
                    expr.getProperty(expr.argument(1, 1), "setHeader"),
                    [
                      expr.stringLiteral("content-type"),
                      expr.stringLiteral("text/html")
                    ]
                  )
                ),
                expr.evaluateExpr(
                  expr.call(expr.getProperty(expr.argument(1, 1), "send"), [
                    expr.stringLiteral("htmlをリクエストした")
                  ])
                ),
                expr.returnVoidStatement()
              ]
            ),
            expr.evaluateExpr(
              expr.call(expr.getProperty(expr.argument(0, 1), "send"), [
                expr.stringLiteral("APIのレスポンス")
              ])
            )
          ],
          document: "ミドルウェア"
        }
      ]
    };
    fs.writeFile(
      outFileName,
      generator.toNodeJsCodeAsTypeScript(nodeJsCode),
      () => {
        resolve();
      }
    );
  });
