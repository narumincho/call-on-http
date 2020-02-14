import { expr, typeExpr } from "js-ts-code-generator";
import * as generator from "js-ts-code-generator";
import * as type from "./type";
import * as binary from "./binary";

const responseType = typeExpr.globalType("Response");

const fetchWithBody = (array: ReadonlyArray<number>): generator.expr.Expr => {
  const fetch = expr.globalVariable("fetch");
  const location = expr.globalVariable("location");
  const uint8Array = expr.globalVariable("Uint8Array");

  return expr.call(fetch, [
    expr.get(location, "href"),
    expr.objectLiteral(
      new Map([
        ["method", expr.stringLiteral("POST")],
        [
          "headers",
          expr.arrayLiteral([
            expr.arrayLiteral([
              expr.stringLiteral("content-type"),
              expr.stringLiteral("application/octet-stream")
            ])
          ])
        ],
        [
          "body",
          expr.newExpr(uint8Array, [
            expr.arrayLiteral(array.map(expr.numberLiteral))
          ])
        ]
      ])
    )
  ]);
};

const httpRequestFunction = (
  functionName: string,
  functionId: type.FunctionId
): generator.ExportFunction => ({
  name: functionName,
  document: "",
  parameterList: [
    {
      name: "callback",
      document: "",
      typeExpr: typeExpr.functionReturnVoid([])
    }
  ],
  returnType: null,
  statementList: [
    expr.evaluateExpr(
      expr.callMethod(
        expr.callMethod(fetchWithBody(binary.idToArray(functionId)), "then", [
          expr.lambdaReturnVoid(
            [responseType],
            [
              expr.returnStatement(
                expr.callMethod(expr.argument(0, 0), "text", [])
              )
            ]
          )
        ]),
        "then",
        [
          expr.lambdaReturnVoid(
            [typeExpr.typeString],
            [
              expr.evaluateExpr(
                expr.call(expr.argument(1, 0), [expr.argument(0, 0)])
              )
            ]
          )
        ]
      )
    )
  ]
});

/**
 * クライアント用のコードを生成する
 */
export const create = (
  api: type.Api
): ReadonlyArray<generator.ExportFunction> =>
  api.functionList.map(func => httpRequestFunction(func.name, func.id));
