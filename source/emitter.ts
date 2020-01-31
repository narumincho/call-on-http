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

const browserCode = (serverCode: type.ServerCode): string => {
  return 'console.log("ok")';
};

const createHtmlFromServerCode = (serverCode: type.ServerCode): string => {
  return `<!doctype html>
<html lang="ja">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1.0">
    <title>${escapeInHtml(serverCode.apiName)} : API Document</title>
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
    ${htmlElementToString(scriptESModules(browserCode(serverCode)))}
</head>

${htmlElementToString(
  body([
    h1(serverCode.apiName + "API Document"),
    section([h2("Function"), functionMapToHtml(serverCode.functionMap)]),
    section([h2("Type"), typeMapToHtml(serverCode.typeMap)])
  ])
)}
</html>
`;
};

const functionMapToHtml = (
  functionMap: Map<string, type.FunctionData>
): HtmlElement =>
  div(
    null,
    [...functionMap.entries()].map(
      ([name, data]): HtmlElement =>
        div("function-" + name, [
          h3(name),
          div(null, data.document),
          div(null, [
            div(null, "parameter list"),
            parameterListToHtml(name, data.parameters)
          ]),
          div(null, [div(null, "return type"), typeToHtml(data.return)]),
          button("call-function-" + name, "Call")
        ])
    )
  );

const parameterListToHtml = (
  functionName: string,
  parameterList: ReadonlyArray<[string, type.Type]>
): HtmlElement =>
  div(
    null,
    parameterList.map(
      ([parameterName, parameterType]): HtmlElement =>
        div(null, [
          div(null, parameterName),
          typeToHtml(parameterType),
          inputText(
            "parameter-input-" + functionName + "-" + parameterName,
            functionName + "-" + parameterName
          )
        ])
    )
  );

const typeToHtml = (type_: type.Type): HtmlElement => {
  switch (type_._) {
    case type.Type_.Number:
      return div(null, "number");
    case type.Type_.String:
      return div(null, "string");
    case type.Type_.Boolean:
      return div(null, "boolean");
    case type.Type_.Null:
      return div(null, "null");
    case type.Type_.Undefined:
      return div(null, "undefined");
    case type.Type_.Object:
      return div(
        null,
        type_.members.map(
          ([propertyName, propertyType]): HtmlElement =>
            div(null, [
              div(null, propertyName),
              div(null, propertyType.document),
              typeToHtml(propertyType.type_)
            ])
        )
      );
    case type.Type_.Reference:
      return div(null, `ref(${type_.name})`);
    case type.Type_.Union:
      return div(null, type_.typeList.map(typeToHtml));
  }
};

const typeMapToHtml = (
  typeMap: ReadonlyMap<string, type.TypeData>
): HtmlElement =>
  div(
    null,
    [...typeMap.entries()].map(
      ([typeName, typeData]): HtmlElement =>
        div("type-" + typeName, [
          h3(typeName),
          div(null, typeData.document),
          typeToHtml(typeData.type_)
        ])
    )
  );

const scriptESModules = (code: string): HtmlElement => ({
  name: "script",
  attributes: new Map([["type", "module"]]),
  children: { _: HtmlElementChildren_.RawText, text: code }
});

const div = (
  id: string | null,
  children: ReadonlyArray<HtmlElement> | string
): HtmlElement => ({
  name: "div",
  attributes: new Map(id === null ? [] : [["id", id]]),
  children:
    typeof children === "string"
      ? { _: HtmlElementChildren_.Text, text: children }
      : { _: HtmlElementChildren_.HtmlElementList, value: children }
});

const h1 = (children: ReadonlyArray<HtmlElement> | string): HtmlElement => ({
  name: "h1",
  attributes: new Map(),
  children:
    typeof children === "string"
      ? { _: HtmlElementChildren_.Text, text: children }
      : { _: HtmlElementChildren_.HtmlElementList, value: children }
});

const h2 = (children: ReadonlyArray<HtmlElement> | string): HtmlElement => ({
  name: "h2",
  attributes: new Map(),
  children:
    typeof children === "string"
      ? { _: HtmlElementChildren_.Text, text: children }
      : { _: HtmlElementChildren_.HtmlElementList, value: children }
});

const h3 = (children: ReadonlyArray<HtmlElement> | string): HtmlElement => ({
  name: "h3",
  attributes: new Map(),
  children:
    typeof children === "string"
      ? { _: HtmlElementChildren_.Text, text: children }
      : { _: HtmlElementChildren_.HtmlElementList, value: children }
});

const section = (children: ReadonlyArray<HtmlElement>): HtmlElement => ({
  name: "section",
  attributes: new Map(),
  children:
    typeof children === "string"
      ? { _: HtmlElementChildren_.Text, text: children }
      : { _: HtmlElementChildren_.HtmlElementList, value: children }
});

const inputText = (id: string, name: string): HtmlElement => ({
  name: "input",
  attributes: new Map([
    ["id", id],
    ["name", name]
  ]),
  children: {
    _: HtmlElementChildren_.NoEndTag
  }
});

const button = (
  id: string,
  children: ReadonlyArray<HtmlElement> | string
): HtmlElement => ({
  name: "button",
  attributes: new Map([["id", id]]),
  children:
    typeof children === "string"
      ? { _: HtmlElementChildren_.Text, text: children }
      : { _: HtmlElementChildren_.HtmlElementList, value: children }
});

const body = (children: ReadonlyArray<HtmlElement> | string): HtmlElement => ({
  name: "body",
  attributes: new Map(),
  children:
    typeof children === "string"
      ? { _: HtmlElementChildren_.Text, text: children }
      : { _: HtmlElementChildren_.HtmlElementList, value: children }
});
/**
 * HtmlElement (need validated)
 */
type HtmlElement = {
  name: string;
  /**
   * 属性名は正しい必要がある
   */
  attributes: ReadonlyMap<string, string>;
  /**
   * 子供。nullで閉じカッコなし `<img src="url" alt="image">`
   * `[]`や`""`の場合は `<script src="url"></script>`
   * `<path d="M1,2 L20,53"/>`のような閉じカッコの省略はしない
   */
  children: HtmlElementChildren;
};

type HtmlElementChildren =
  | {
      _: HtmlElementChildren_.HtmlElementList;
      value: ReadonlyArray<HtmlElement>;
    }
  | {
      _: HtmlElementChildren_.Text;
      text: string;
    }
  | {
      _: HtmlElementChildren_.RawText;
      text: string;
    }
  | {
      _: HtmlElementChildren_.NoEndTag;
    };

const enum HtmlElementChildren_ {
  HtmlElementList,
  /**
   * 中の文字列をエスケープする
   */
  Text,
  /**
   * 中の文字列をそのまま扱う `<script>`用
   */
  RawText,
  /**
   * 閉じカッコなし `<img src="url" alt="image">`
   */
  NoEndTag
}

const escapeInHtml = (text: string): string =>
  text
    .replace(/&/g, "&amp;")
    .replace(/>/g, "&gt;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/`/g, "&#x60;");

const htmlElementToString = (htmlElement: HtmlElement): string => {
  const startTag =
    "<" + htmlElement.name + attributesToString(htmlElement.attributes) + ">";
  const endTag = "</" + htmlElement.name + ">";
  switch (htmlElement.children._) {
    case HtmlElementChildren_.HtmlElementList:
      return (
        startTag +
        htmlElement.children.value.map(htmlElementToString).join("") +
        endTag
      );
    case HtmlElementChildren_.Text:
      return startTag + escapeInHtml(htmlElement.children.text) + endTag;
    case HtmlElementChildren_.RawText:
      return startTag + htmlElement.children.text + endTag;
    case HtmlElementChildren_.NoEndTag:
      return startTag;
  }
};

const attributesToString = (
  attributeMap: ReadonlyMap<string, string>
): string => {
  if (attributeMap.size === 0) {
    return "";
  }
  return (
    " " +
    [...attributeMap.entries()]
      .map(([key, value]): string => key + '="' + escapeInHtml(value) + '"')
      .join(" ")
  );
};
