import * as type from "./type";
import * as generator from "js-ts-code-generator";
import { expr, typeExpr } from "js-ts-code-generator";
import * as h from "@narumincho/html";
import * as browserCode from "./browserCode";
import * as binary from "./binary";
import { URL } from "url";

export const emit = (api: type.Api): string => {
  const html = createHtmlFromServerCode(api);

  const globalType = generator.typeExpr.globalTypeList([
    "Buffer",
    "Uint8Array"
  ] as const);

  const expressType = generator.typeExpr.importedTypeList("express", [
    "Request",
    "Response"
  ] as const);

  const acceptName = ["accept"];
  const accept = expr.localVariable(acceptName);
  const request = expr.localVariable(["request"]);
  const response = expr.localVariable(["response"]);
  const bodyName = ["body"];
  const body = expr.localVariable(bodyName);
  const requestBinaryName = ["requestBinary"];
  const requestBinary = expr.localVariable(requestBinaryName);
  const functionIdAndIndexName = ["functionIdAndIndex"];
  const functionIdAndIndex = expr.localVariable(functionIdAndIndexName);
  const functionIdName = ["functionId"];
  const functionId = expr.localVariable(functionIdName);

  const typeIdNameDictionary = new Map(
    api.requestObjectList.map(requestObject => [
      requestObject.id,
      requestObject.name
    ])
  );

  const middleware = generator.exportFunction({
    name: "middleware",
    parameterList: [
      {
        name: "request",
        document: "リクエスト",
        typeExpr: expressType.Request
      },
      {
        name: "response",
        document: "レスポンス",
        typeExpr: expressType.Response
      }
    ],
    document: "ミドルウェア",
    returnType: null,
    statementList: [
      expr.variableDefinition(
        acceptName,
        typeExpr.union([typeExpr.typeString, typeExpr.typeUndefined]),
        expr.get(expr.get(request, "headers"), "accept")
      ),
      expr.ifStatement(
        expr.logicalAnd(
          expr.notEqual(accept, expr.undefinedLiteral),
          expr.callMethod(accept, "includes", [expr.literal("text/html")])
        ),
        [
          expr.evaluateExpr(
            expr.callMethod(response, "setHeader", [
              expr.literal("content-type"),
              expr.literal("text/html")
            ])
          ),
          expr.evaluateExpr(
            expr.callMethod(response, "send", [expr.stringLiteral(html)])
          ),
          expr.returnVoidStatement
        ]
      ),
      expr.variableDefinition(
        bodyName,
        typeExpr.union([typeExpr.typeUndefined, globalType.Buffer]),
        expr.get(request, "body")
      ),
      expr.ifStatement(expr.equal(body, expr.undefinedLiteral), [
        expr.throwError(`use binary body parser. in middleware app.

const app = express();

app.use(express.raw());
app.use(path, out.middleware);`)
      ]),
      expr.variableDefinition(
        requestBinaryName,
        globalType.Uint8Array,
        expr.newExpr(expr.globalVariable("Uint8Array"), [body])
      ),
      binary.decodeInt32Code,
      expr.variableDefinition(
        functionIdAndIndexName,
        binary.resultAndNextIndexType(typeExpr.typeNumber),
        expr.call(binary.decodeUInt32Var, [
          expr.numberLiteral(0),
          requestBinary
        ])
      ),
      expr.variableDefinition(
        functionIdName,
        typeExpr.typeNumber,
        expr.get(functionIdAndIndex, "result")
      ),
      binary.decodeStringCode(false),
      ...api.requestObjectList.map(requestObject =>
        binary.decodeRequestObjectCode(requestObject, typeIdNameDictionary)
      ),
      ...api.functionList.map(apiFunction =>
        expr.ifStatement(
          expr.equal(functionId, expr.numberLiteral(apiFunction.id)),
          [
            expr.evaluateExpr(
              expr.callMethod(response, "send", [
                expr.call(expr.globalVariable(apiFunction.name), [
                  expr.get(
                    expr.call(
                      binary.decodeRequestObjectCodeVar(apiFunction.request),
                      [expr.get(functionIdAndIndex, "nextIndex"), requestBinary]
                    ),
                    "result"
                  )
                ])
              ])
            )
          ]
        )
      )
    ]
  });

  const requestTypeAliasAndMaybeConstEnumList = api.requestObjectList.map(
    requestObjectType =>
      binary.requestObjectTypeToTypeAlias(
        requestObjectType,
        typeIdNameDictionary
      )
  );

  const serverCodeTemplate: ReadonlyArray<generator.ExportFunction> = api.functionList.map(
    apiFunction => {
      const parameterTypeName = typeIdNameDictionary.get(apiFunction.request);
      if (parameterTypeName === undefined) {
        throw new Error(
          "パラメータで与えられたIDの型を見つけることができなかった id=" +
            apiFunction.request.toString()
        );
      }
      return generator.exportFunction({
        name: apiFunction.name,
        document:
          "@id " + apiFunction.id.toString() + "\n" + apiFunction.description,
        parameterList: [
          {
            name: "request",
            document: "",
            typeExpr: typeExpr.globalType(parameterTypeName)
          }
        ],
        returnType: generator.typeExpr.typeString,
        statementList: [
          expr.returnStatement(
            expr.stringLiteral(
              apiFunction.name + "@" + apiFunction.id.toString()
            )
          )
        ]
      });
    }
  );
  const exportConstEnumMap: Map<
    string,
    generator.type.ExportConstEnumTagNameAndValueList
  > = new Map();
  for (const { exportConstEnum } of requestTypeAliasAndMaybeConstEnumList) {
    if (exportConstEnum !== null) {
      exportConstEnumMap.set(
        exportConstEnum.name,
        exportConstEnum.tagNameAndValueList
      );
    }
  }

  const nodeJsCode: generator.Code = {
    exportTypeAliasList: requestTypeAliasAndMaybeConstEnumList.map(
      typeDefinition => typeDefinition.typeAlias
    ),
    exportConstEnumMap,
    exportFunctionList: [middleware].concat(serverCodeTemplate),
    statementList: []
  };

  return generator.toNodeJsOrBrowserCodeAsTypeScript(nodeJsCode);
};

const createBrowserCode = (
  api: type.Api,
  browserFunctionList: ReadonlyArray<generator.ExportFunction>
): string => {
  const document = expr.globalVariable("document");
  const globalConsole = expr.globalVariable("console");

  const code: generator.Code = {
    exportFunctionList: browserFunctionList,
    exportTypeAliasList: [],
    exportConstEnumMap: new Map(),
    statementList: api.functionList.map(func =>
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
              [
                expr.evaluateExpr(
                  expr.call(expr.globalVariable(func.name), [
                    expr.lambdaReturnVoid(
                      [{ name: ["e"], typeExpr: typeExpr.typeString }],
                      [
                        expr.evaluateExpr(
                          expr.callMethod(globalConsole, "log", [
                            expr.localVariable(["e"])
                          ])
                        )
                      ]
                    )
                  ])
                )
              ]
            )
          ]
        )
      )
    )
  };
  return generator.toESModulesBrowserCode(code);
};

const createHtmlFromServerCode = (api: type.Api): string => {
  const browserFunctionList = browserCode.create(api);
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
      overflow-wrap: break-word;
    }
    
    code {
      white-space: pre-wrap;
      overflow-wrap: break-word;
    }
    `,
    script: createBrowserCode(api, browserFunctionList),
    iconPath: [],
    coverImageUrl: api.url,
    styleUrlList: [],
    scriptUrlList: [],
    javaScriptMustBeAvailable: true,
    path: [],
    origin: "",
    description: "",
    themeColor: "#00ff00",
    twitterCard: h.TwitterCard.SummaryCard,
    language: h.Language.Japanese,
    body: [
      h.h1({}, api.name + "API Document"),
      h.section({}, [h.h2({}, "Function"), functionListToHtml(api)]),
      h.section({}, [
        h.h2({}, "Request Object"),
        requestObjectToHtml(api.requestObjectList, api.responseObjectList)
      ]),
      h.section({}, [
        h.h2({}, "Response Object"),
        responseObjectToHtml(api.responseObjectList, api.requestObjectList)
      ]),
      h.section({}, [
        h.h2({}, "Browser Code TypeScript"),
        h.code(
          {},
          generator.toNodeJsOrBrowserCodeAsTypeScript({
            exportFunctionList: browserFunctionList,
            exportConstEnumMap: new Map(),
            exportTypeAliasList: [],
            statementList: []
          })
        )
      ]),
      h.section({}, [
        h.h2({}, "Browser Code JavaScript"),
        h.code(
          {},
          generator.toESModulesBrowserCode({
            exportFunctionList: browserFunctionList,
            exportConstEnumMap: new Map(),
            exportTypeAliasList: [],
            statementList: []
          })
        )
      ])
    ]
  });
};

const functionListToHtml = (api: type.Api): h.Element =>
  h.div(
    {},
    api.functionList.map<h.Element>(func =>
      h.div({ id: "function-" + func.id.toString() }, [
        h.h3({}, func.name),
        h.div({}, func.id.toString()),
        h.div({}, func.description),
        h.div({}, [
          h.div({}, "request object type"),
          h.div(
            {},
            type.getRequestObject(func.request, api.requestObjectList).name
          )
        ]),
        h.div({}, [
          h.div({}, "response object type"),
          h.div(
            {},
            type.getResponseObject(func.response, api.responseObjectList).name
          )
        ]),
        h.button({ id: requestButtonId(func.id) }, "Request")
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
      return h.div({}, "string");
    case type.Type_.UInt32:
      return h.div({}, "integer");
    case type.Type_.DateTime:
      return h.div({}, "dateTime");
    case type.Type_.List:
      return h.div({}, [
        h.div({}, "list"),
        requestTypeToHtml(type_.type, requestObjectList, responseObjectList)
      ]);
    case type.Type_.Id:
      return h.div(
        {},
        type.getResponseObject(type_.responseObjectId, responseObjectList)
          .name + "-id"
      );
    case type.Type_.Hash:
      return h.div(
        {},
        type.getResponseObject(type_.responseObjectId, responseObjectList)
          .name + "-hash"
      );
    case type.Type_.Object:
      return h.div(
        {},
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
      return h.div({}, "string");
    case type.Type_.UInt32:
      return h.div({}, "integer");
    case type.Type_.DateTime:
      return h.div({}, "dateTime");
    case type.Type_.List:
      return h.div({}, [
        h.div({}, "list"),
        responseTypeToHtml(type_.type, requestObjectList, responseObjectList)
      ]);
    case type.Type_.Id:
      return h.div(
        {},
        type.getResponseObject(type_.responseObjectId, responseObjectList)
          .name + "-id"
      );
    case type.Type_.Hash:
      return h.div(
        {},
        type.getResponseObject(type_.responseObjectId, responseObjectList)
          .name + "-hash"
      );
    case type.Type_.Object:
      return h.div(
        {},
        type.getResponseObject(type_.objectId, responseObjectList).name
      );
  }
};

const requestObjectToHtml = (
  requestObjectList: ReadonlyArray<type.RequestObject>,
  responseObjectList: ReadonlyArray<type.ResponseObject>
): h.Element =>
  h.div(
    {},
    requestObjectList.map<h.Element>(requestObject =>
      h.div({}, [
        h.h3({}, requestObject.name),
        h.div({}, requestObject.id.toString()),
        h.div({}, requestObject.description),
        h.div(
          {},
          requestObject.patternList.map<h.Element>(pattern =>
            h.div({}, [
              h.div({}, pattern.name),
              h.div({}, pattern.id.toString()),
              h.div(
                {},
                pattern.memberList.map(member =>
                  h.div({}, [
                    h.div({}, member.name),
                    h.div({}, member.id.toString()),
                    h.div({}, member.description),
                    requestTypeToHtml(
                      member.type,
                      requestObjectList,
                      responseObjectList
                    )
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
  responseObjectList: ReadonlyArray<type.ResponseObject>,
  requestObjectList: ReadonlyArray<type.RequestObject>
): h.Element =>
  h.div(
    {},
    responseObjectList.map<h.Element>(responseObject =>
      h.div({ id: "response-object-" + responseObject.name }, [
        h.h3({}, responseObject.name),
        h.div({}, responseObject.description),
        cacheTypeToElement(responseObject.cacheType),
        h.div(
          {},
          responseObject.patternList.map<h.Element>(pattern =>
            h.div({}, [
              h.div({}, pattern.name),
              h.div({}, pattern.id.toString()),
              h.div(
                {},
                pattern.memberList.map(member =>
                  h.div({}, [
                    h.div({}, member.name),
                    h.div({}, member.id.toString()),
                    h.div({}, member.description),
                    responseTypeToHtml(
                      member.type,
                      requestObjectList,
                      responseObjectList
                    )
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
      return h.div({}, "never");
    case type.CacheType_.CacheById:
      return h.div(
        {},
        "cacheById freshTime=" + cacheType.freshSeconds.toString() + "s"
      );
    case type.CacheType_.cacheByHash:
      return h.div({}, "hash");
  }
};

const requestButtonId = (functionId: type.FunctionId): string =>
  "request-" + functionId.toString();
