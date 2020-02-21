import { expr, typeExpr } from "js-ts-code-generator";
import * as generator from "js-ts-code-generator";
import * as type from "./type";
import * as binary from "./binary";
import { URL } from "url";

const responseType = typeExpr.globalType("Response");

const fetchWithBody = (
  url: URL,
  array: ReadonlyArray<number>
): generator.expr.Expr => {
  const fetch = expr.globalVariable("fetch");
  const uint8Array = expr.globalVariable("Uint8Array");

  return expr.call(fetch, [
    expr.stringLiteral(url.toString()),
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
  url: URL,
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
        expr.callMethod(
          fetchWithBody(url, binary.encodeInt32(functionId)),
          "then",
          [
            expr.lambdaReturnVoid(
              [{ name: ["e"], typeExpr: responseType }],
              [
                expr.returnStatement(
                  expr.callMethod(expr.localVariable(["e"]), "text", [])
                )
              ]
            )
          ]
        ),
        "then",
        [
          expr.lambdaReturnVoid(
            [{ name: ["e"], typeExpr: typeExpr.typeString }],
            [
              expr.evaluateExpr(
                expr.call(expr.localVariable(["callback"]), [
                  expr.localVariable(["e"])
                ])
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
  api.functionList.map(func =>
    httpRequestFunction(api.url, func.name, func.id)
  );
