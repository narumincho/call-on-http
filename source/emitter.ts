import * as type from "./type";
import * as generator from "js-ts-code-generator";
import * as fs from "fs";
import { expr, typeExpr } from "js-ts-code-generator";
import * as util from "util";

export const emit = (
  serverCode: type.ServerCode,
  outFileName: string
): Promise<void> =>
  new Promise((resolve, reject) => {
    console.log(util.inspect(serverCode, false, null));

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
  ${htmlElementToString(h1(serverCode.apiName + "API Document"))}
  <section>
    <h2>Function</h2>
    ${htmlElementToString(functionMapToHtml(serverCode.functionMap))}
  </section>
  <section>
    <h2>Type</h2>
    ${htmlElementToString(typeMapToHtml(serverCode.typeMap))}
  </section>
</body>

</html>
`;
};

const functionMapToHtml = (
  functionMap: Map<string, type.FunctionData>
): HtmlElement =>
  div(
    [...functionMap.entries()].map(
      ([name, data]): HtmlElement =>
        div([
          h3(name),
          div(data.document),
          div([div("parameter list"), parameterListToHtml(data.parameters)]),
          div([div("return type"), typeToHtml(data.return)])
        ])
    )
  );

const parameterListToHtml = (
  parameterList: ReadonlyArray<[string, type.Type]>
): HtmlElement =>
  div(
    parameterList.map(
      ([parameterName, parameterType]): HtmlElement =>
        div([div(parameterName), typeToHtml(parameterType)])
    )
  );

const typeToHtml = (type_: type.Type): HtmlElement => {
  switch (type_._) {
    case type.Type_.Number:
      return div("number");
    case type.Type_.String:
      return div("string");
    case type.Type_.Boolean:
      return div("boolean");
    case type.Type_.Null:
      return div("null");
    case type.Type_.Undefined:
      return div("undefined");
    case type.Type_.Object:
      return div(
        type_.members.map(
          ([propertyName, propertyType]): HtmlElement =>
            div([
              div(propertyName),
              div(propertyType.document),
              typeToHtml(propertyType.type_)
            ])
        )
      );
    case type.Type_.Reference:
      return div(`ref(${type_.name})`);
    case type.Type_.Union:
      return div(type_.typeList.map(typeToHtml));
  }
};

const typeMapToHtml = (
  typeMap: ReadonlyMap<string, type.TypeData>
): HtmlElement =>
  div(
    [...typeMap.entries()].map(
      ([typeName, typeData]): HtmlElement =>
        div([h3(typeName), div(typeData.document), typeToHtml(typeData.type_)])
    )
  );

type HtmlElement = {
  name: string;
  children: ReadonlyArray<HtmlElement> | string;
};

const div = (children: ReadonlyArray<HtmlElement> | string): HtmlElement => ({
  name: "div",
  children
});

const h1 = (children: ReadonlyArray<HtmlElement> | string): HtmlElement => ({
  name: "div",
  children
});

const h2 = (children: ReadonlyArray<HtmlElement> | string): HtmlElement => ({
  name: "div",
  children
});

const h3 = (children: ReadonlyArray<HtmlElement> | string): HtmlElement => ({
  name: "div",
  children
});

const escapeHtml = (text: string): string =>
  text.replace(/[&'`"<>]/gu, (s: string): string =>
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

const htmlElementToString = (htmlElement: HtmlElement): string =>
  "<" +
  htmlElement.name +
  ">" +
  (typeof htmlElement.children === "string"
    ? escapeHtml(htmlElement.children)
    : htmlElement.children.map(htmlElementToString).join("")) +
  "</" +
  htmlElement.name +
  ">";
