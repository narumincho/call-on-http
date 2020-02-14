import * as type from "./type";
import * as generator from "js-ts-code-generator";
import { expr, typeExpr } from "js-ts-code-generator";
import * as h from "@narumincho/html";

export const emit = (api: type.Api): string => {
  const html = createHtmlFromServerCode(api);

  const global = generator.createGlobalNamespace<
    ["Buffer", "Uint8Array"],
    ["Uint8Array"]
  >(["Buffer", "Uint8Array"], ["Uint8Array"]);

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
              expr.stringLiteral(html)
            ])
          ),
          expr.returnVoidStatement
        ]
      ),
      expr.variableDefinition(
        typeExpr.union([typeExpr.typeUndefined, global.typeList.Buffer]),
        expr.get(expr.argument(0, 0), "body")
      ),
      expr.ifStatement(
        expr.equal(expr.localVariable(0, 1), expr.undefinedLiteral),
        [
          expr.throwError(`use binary body parser. in middleware app.

const app = express();

app.use(express.raw());
app.use(path, out.middleware);`)
        ]
      ),
      expr.variableDefinition(
        global.typeList.Uint8Array,
        expr.newExpr(global.variableList.Uint8Array, [expr.localVariable(0, 1)])
      ),
      ...api.functionList.map(apiFunction =>
        expr.ifStatement(
          uint8ArrayStartWithFunctionId(
            apiFunction.id,
            expr.localVariable(0, 2)
          ),
          [
            expr.evaluateExpr(
              expr.callMethod(expr.argument(1, 1), "send", [
                expr.stringLiteral(apiFunction.name)
              ])
            )
          ]
        )
      )
    ],
    document: "ミドルウェア"
  });

  const nodeJsCode: generator.Code = {
    exportTypeAliasList: [],
    exportFunctionList: [middleware],
    statementList: []
  };

  return generator.toNodeJsCodeAsTypeScript(nodeJsCode);
};

const uint8ArrayStartWithFunctionId = (
  functionId: type.FunctionId,
  uint8ArrayExpr: generator.expr.Expr
): generator.expr.Expr => {
  const idAsNumberArray = idToArray(functionId);
  let expr = generator.expr.logicalAnd(
    generator.expr.equal(
      generator.expr.getByExpr(uint8ArrayExpr, generator.expr.numberLiteral(0)),
      generator.expr.numberLiteral(idAsNumberArray[0])
    ),
    generator.expr.equal(
      generator.expr.getByExpr(uint8ArrayExpr, generator.expr.numberLiteral(1)),
      generator.expr.numberLiteral(idAsNumberArray[1])
    )
  );
  for (let i = 2; i < 16; i++) {
    expr = generator.expr.logicalAnd(
      expr,
      generator.expr.equal(
        generator.expr.getByExpr(
          uint8ArrayExpr,
          generator.expr.numberLiteral(i)
        ),
        generator.expr.numberLiteral(idAsNumberArray[i])
      )
    );
  }
  return expr;
};

const idToArray = (id: string): ReadonlyArray<number> => {
  const binary = [];
  for (let i = 0; i < 16; i++) {
    binary.push(Number.parseInt(id.slice(i * 2, i * 2 + 2), 16));
  }
  return binary;
};

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

const browserCode = (functionList: ReadonlyArray<type.ApiFunction>): string => {
  const document = expr.globalVariable("document");
  const globalConsole = expr.globalVariable("console");
  const responseType = typeExpr.globalType("Response");

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
          expr.callMethod(fetchWithBody(idToArray(functionId)), "then", [
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
                  expr.callMethod(globalConsole, "log", [expr.argument(0, 0)])
                )
              ]
            )
          ]
        )
      )
    ]
  });

  const exportFunctionList: ReadonlyArray<generator.ExportFunction> = functionList.map(
    func => httpRequestFunction(func.name, func.id)
  );

  const code: generator.Code = {
    exportFunctionList,
    exportTypeAliasList: [],
    statementList: functionList.map((func, index) =>
      expr.evaluateExpr(
        expr.callMethod(
          expr.callMethod(document, "getElementById", [
            expr.stringLiteral(requestButtonId(func.id))
          ]),
          "addEventListener",
          [
            expr.stringLiteral("click"),
            expr.lambdaReturnVoid(
              [],
              [expr.evaluateExpr(expr.call(expr.localVariable(2, index), []))]
            )
          ]
        )
      )
    )
  };
  return generator.toESModulesBrowserCode(code);
};

const createHtmlFromServerCode = (api: type.Api): string => {
  return h.toString({
    appName: api.name + "API Document",
    pageName: api.name + "API Document",
    style: `
    body {
      margin: 0;
      background-color: black;
      color: white;
    }

    h1 {
      margin: 0;
      padding: 1rem;
    }

    h2 {
      margin: 0;
    }

    h3 {
      margin: 0;
    }

    section {
      padding: 1rem;
    }

    div {
      padding: 0.5rem;
      background-color: rgba(100,255,2100, 0.1);
    }`,
    script: browserCode(api.functionList),
    iconPath: [],
    coverImageUrl: "",
    scriptUrlList: [],
    javaScriptMustBeAvailable: true,
    path: [],
    origin: "",
    description: "",
    themeColor: "#00ff00",
    twitterCard: h.TwitterCard.SummaryCard,
    language: h.Language.Japanese,
    body: [
      h.h1(api.name + "API Document"),
      h.section([h.h2("Function"), functionListToHtml(api)]),
      h.section([
        h.h2("RequestObject"),
        requestObjectToHtml(api.requestObjectList)
      ]),
      h.section([
        h.h2("ResponseObject"),
        responseObjectToHtml(api.responseObjectList)
      ])
    ]
  });
};

const functionListToHtml = (api: type.Api): h.Element =>
  h.div(
    null,
    api.functionList.map(
      (func): h.Element =>
        h.div("function-" + (func.id as string), [
          h.h3(func.name),
          h.div(null, func.id),
          h.div(null, func.description),
          h.div(null, [
            h.div(null, "request object type"),
            h.div(
              null,
              type.getRequestObject(func.request, api.requestObjectList).name
            )
          ]),
          h.div(null, [
            h.div(null, "response object type"),
            h.div(
              null,
              type.getResponseObject(func.response, api.responseObjectList).name
            )
          ]),
          h.button(requestButtonId(func.id), "Request")
        ])
    )
  );

const requestTypeToHtml = (
  type_: type.Type<type.RequestObjectId>,
  requestObjectList: ReadonlyArray<type.RequestObject>,
  responseObjectList: ReadonlyArray<type.ResponseObject>
): h.Element => {
  switch (type_._) {
    case type.Type_.String:
      return h.div(null, "string");
    case type.Type_.Integer:
      return h.div(null, "integer");
    case type.Type_.DateTime:
      return h.div(null, "dateTime");
    case type.Type_.List:
      return h.div(null, [
        h.div(null, "list"),
        requestTypeToHtml(type_.type, requestObjectList, responseObjectList)
      ]);
    case type.Type_.Id:
      return h.div(
        null,
        type.getResponseObject(type_.responseObjectId, responseObjectList)
          .name + "-id"
      );
    case type.Type_.Hash:
      return h.div(
        null,
        type.getResponseObject(type_.responseObjectId, responseObjectList)
          .name + "-hash"
      );
    case type.Type_.Object:
      return h.div(
        null,
        type.getRequestObject(type_.objectId, requestObjectList).name
      );
  }
};

const responseTypeToHtml = (
  type_: type.Type<type.ResponseObjectId>,
  requestObjectList: ReadonlyArray<type.RequestObject>,
  responseObjectList: ReadonlyArray<type.ResponseObject>
): h.Element => {
  switch (type_._) {
    case type.Type_.String:
      return h.div(null, "string");
    case type.Type_.Integer:
      return h.div(null, "integer");
    case type.Type_.DateTime:
      return h.div(null, "dateTime");
    case type.Type_.List:
      return h.div(null, [
        h.div(null, "list"),
        responseTypeToHtml(type_.type, requestObjectList, responseObjectList)
      ]);
    case type.Type_.Id:
      return h.div(
        null,
        type.getResponseObject(type_.responseObjectId, responseObjectList)
          .name + "-id"
      );
    case type.Type_.Hash:
      return h.div(
        null,
        type.getResponseObject(type_.responseObjectId, responseObjectList)
          .name + "-hash"
      );
    case type.Type_.Object:
      return h.div(
        null,
        type.getResponseObject(type_.objectId, responseObjectList).name
      );
  }
};

const requestObjectToHtml = (
  requestObjectList: ReadonlyArray<type.RequestObject>
): h.Element =>
  h.div(
    null,
    requestObjectList.map(
      (requestObject): h.Element =>
        h.div(null, [
          h.h3(requestObject.name),
          h.div(null, requestObject.id),
          h.div(null, requestObject.description),
          h.div(
            null,
            requestObject.patternList.map(
              (pattern): h.Element =>
                h.div(null, [
                  h.div(null, pattern.name),
                  h.div(null, pattern.id),
                  h.div(
                    null,
                    pattern.memberList.map(member =>
                      h.div(null, [
                        h.div(null, member.name),
                        h.div(null, member.id),
                        h.div(null, member.description)
                      ])
                    )
                  )
                ])
            )
          )
        ])
    )
  );

const responseObjectToHtml = (
  responseObjectList: ReadonlyArray<type.ResponseObject>
): h.Element =>
  h.div(
    null,
    responseObjectList.map(
      (responseObject): h.Element =>
        h.div("response-object-" + responseObject.name, [
          h.h3(responseObject.name),
          h.div(null, responseObject.description),
          cacheTypeToElement(responseObject.cacheType),
          h.div(
            null,
            responseObject.patternList.map(
              (pattern): h.Element =>
                h.div(null, [
                  h.div(null, pattern.name),
                  h.div(null, pattern.id),
                  h.div(
                    null,
                    pattern.memberList.map(member =>
                      h.div(null, [
                        h.div(null, member.name),
                        h.div(null, member.id),
                        h.div(null, member.description)
                      ])
                    )
                  )
                ])
            )
          )
        ])
    )
  );

const cacheTypeToElement = (cacheType: type.CacheType): h.Element => {
  switch (cacheType._) {
    case type.CacheType_.Never:
      return h.div(null, "never");
    case type.CacheType_.CacheById:
      return h.div(
        null,
        "cacheById freshTime=" + cacheType.freshSeconds.toString() + "s"
      );
    case type.CacheType_.cacheByHash:
      return h.div(null, "hash");
  }
};

const requestButtonId = (functionId: type.FunctionId): string =>
  "request-" + (functionId as string);
