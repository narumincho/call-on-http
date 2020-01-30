import * as type from "./type";
import * as generator from "js-ts-code-generator";
import * as fs from "fs";
import { expr, typeExpr } from "js-ts-code-generator";

export const emit = (
  serverCode: type.ServerCode,
  outFileName: string
): Promise<void> =>
  new Promise((resolve, reject) => {
    const html = createHtmlFromServerCode(serverCode);

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
              expr.callMethod(expr.argument(1, 1), "send", [expr.literal(html)])
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

const escapeHtml = (text: string): string =>
  text.replace(/[&'`"<>]/g, (s: string): string =>
    s === "&"
      ? "&amp;"
      : s === "'"
      ? "&#x27;"
      : s === "`"
      ? "&#x60;"
      : s === '"'
      ? "&quot;"
      : s === "<"
      ? "&lt;"
      : s === ">"
      ? "&gt;"
      : ""
  );

const createHtmlFromServerCode = (serverCode: type.ServerCode): string => {
  return `<!doctype html>
<html lang="ja">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1.0">
    <title>${escapeHtml(serverCode.apiName)} : API Document</title>
    <style>
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
      }
    </style>
</head>

<body>
  <h1>${escapeHtml(serverCode.apiName)} API Document</h1>
  <section>
    <h2>Function</h2>
    ${functionMapToHtml(serverCode.functionMap)}
  </section>
  <section>
    <h2>Type</h2>
    ${typeMapToHtml(serverCode.typeMap)}
  </section>
</body>

</html>
`;
};

const functionMapToHtml = (
  functionMap: Map<string, type.FunctionData>
): string =>
  "<div>" +
  [...functionMap.entries()]
    .map(
      ([name, data]) => `<div>
  <h3>${escapeHtml(name)}<h3>
  <div>${escapeHtml(data.document)}</div>
  <div>
    <div>parameter</div>
    ${parameterListToHtml(data.parameters)}
  </div>
  <div>
    <div>return type</div>
    ${typeToHtml(data.return)}
  </div>
</div>`
    )
    .join("") +
  "</div>";

const parameterListToHtml = (
  parameterList: ReadonlyArray<[string, type.Type]>
): string => `<div>
${parameterList.map(
  ([parameterName, parameterType]) =>
    `<div>
      <div>${escapeHtml(parameterName)}</div>
      <div>${typeToHtml(parameterType)}</div>
    </div>`
)}
</div>`;

const typeToHtml = (type_: type.Type): string => {
  switch (type_._) {
    case type.Type_.Number:
      return "<div>number</div>";
    case type.Type_.String:
      return "<div>string</div>";
    case type.Type_.Boolean:
      return "<div>boolean</div>";
    case type.Type_.Null:
      return "<div>null</div>";
    case type.Type_.Undefined:
      return "<div>undefined</div>";
    case type.Type_.Object:
      return `<div>${type_.members.map(
        ([propertyName, propertyType]) =>
          `<div>
            <div>${escapeHtml(propertyName)}</div>
            <div>${escapeHtml(propertyType.document)}</div>
            <div>${typeToHtml(propertyType.type_)}</div>
          </div>`
      )}</div>`;
    case type.Type_.Reference:
      return `<div>ref(${type_.name})</div>`;
    case type.Type_.Union:
      return `<div>${type_.typeList.map(typeToHtml).join("")}</div>`;
  }
};

const typeMapToHtml = (typeMap: ReadonlyMap<string, type.TypeData>): string =>
  "<div>" +
  [...typeMap.entries()]
    .map(
      ([typeName, typeData]) => `<div>
<h3>${escapeHtml(typeName)}</h3>
<div>${escapeHtml(typeData.document)}<div>
${typeToHtml(typeData.type_)}
</div>`
    )
    .join("") +
  "</div>";
