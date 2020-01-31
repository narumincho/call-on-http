export const scriptESModules = (code: string): HtmlElement => ({
  name: "script",
  attributes: new Map([["type", "module"]]),
  children: { _: HtmlElementChildren_.RawText, text: code }
});

export const div = (
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

export const h1 = (
  children: ReadonlyArray<HtmlElement> | string
): HtmlElement => ({
  name: "h1",
  attributes: new Map(),
  children:
    typeof children === "string"
      ? { _: HtmlElementChildren_.Text, text: children }
      : { _: HtmlElementChildren_.HtmlElementList, value: children }
});

export const h2 = (
  children: ReadonlyArray<HtmlElement> | string
): HtmlElement => ({
  name: "h2",
  attributes: new Map(),
  children:
    typeof children === "string"
      ? { _: HtmlElementChildren_.Text, text: children }
      : { _: HtmlElementChildren_.HtmlElementList, value: children }
});

export const h3 = (
  children: ReadonlyArray<HtmlElement> | string
): HtmlElement => ({
  name: "h3",
  attributes: new Map(),
  children:
    typeof children === "string"
      ? { _: HtmlElementChildren_.Text, text: children }
      : { _: HtmlElementChildren_.HtmlElementList, value: children }
});

export const section = (children: ReadonlyArray<HtmlElement>): HtmlElement => ({
  name: "section",
  attributes: new Map(),
  children:
    typeof children === "string"
      ? { _: HtmlElementChildren_.Text, text: children }
      : { _: HtmlElementChildren_.HtmlElementList, value: children }
});

export const inputText = (id: string, name: string): HtmlElement => ({
  name: "input",
  attributes: new Map([
    ["id", id],
    ["name", name]
  ]),
  children: {
    _: HtmlElementChildren_.NoEndTag
  }
});

export const button = (
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

export const body = (
  children: ReadonlyArray<HtmlElement> | string
): HtmlElement => ({
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
export type HtmlElement = {
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

/**
 * 子要素のパターン。パターンマッチングのみに使う
 */
export type HtmlElementChildren =
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

/**
 * パターンマッチングのみに使う
 */
export const enum HtmlElementChildren_ {
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

export const escapeInHtml = (text: string): string =>
  text
    .replace(/&/g, "&amp;")
    .replace(/>/g, "&gt;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/`/g, "&#x60;");

export const htmlElementToString = (htmlElement: HtmlElement): string => {
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
