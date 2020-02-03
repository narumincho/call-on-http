export const div = (
  id: string | null,
  children: ReadonlyArray<Element> | string
): Element => ({
  name: "div",
  attributes: new Map(id === null ? [] : [["id", id]]),
  children:
    typeof children === "string"
      ? { _: HtmlElementChildren_.Text, text: children }
      : { _: HtmlElementChildren_.HtmlElementList, value: children }
});

export const h1 = (children: ReadonlyArray<Element> | string): Element => ({
  name: "h1",
  attributes: new Map(),
  children:
    typeof children === "string"
      ? { _: HtmlElementChildren_.Text, text: children }
      : { _: HtmlElementChildren_.HtmlElementList, value: children }
});

export const h2 = (children: ReadonlyArray<Element> | string): Element => ({
  name: "h2",
  attributes: new Map(),
  children:
    typeof children === "string"
      ? { _: HtmlElementChildren_.Text, text: children }
      : { _: HtmlElementChildren_.HtmlElementList, value: children }
});

export const h3 = (children: ReadonlyArray<Element> | string): Element => ({
  name: "h3",
  attributes: new Map(),
  children:
    typeof children === "string"
      ? { _: HtmlElementChildren_.Text, text: children }
      : { _: HtmlElementChildren_.HtmlElementList, value: children }
});

export const section = (children: ReadonlyArray<Element>): Element => ({
  name: "section",
  attributes: new Map(),
  children:
    typeof children === "string"
      ? { _: HtmlElementChildren_.Text, text: children }
      : { _: HtmlElementChildren_.HtmlElementList, value: children }
});

export const inputText = (id: string, name: string): Element => ({
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
  children: ReadonlyArray<Element> | string
): Element => ({
  name: "button",
  attributes: new Map([["id", id]]),
  children:
    typeof children === "string"
      ? { _: HtmlElementChildren_.Text, text: children }
      : { _: HtmlElementChildren_.HtmlElementList, value: children }
});

/**
 * HtmlElement (need validated)
 */
export type Element = {
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
      value: ReadonlyArray<Element>;
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

export type Html = {
  /** 使用している言語 */
  readonly language?: Language;
  /** アプリの名前 */
  readonly appName: string;
  /** タブなどに表示されるページのタイトル */
  readonly pageName: string;
  /** ページの説明 */
  readonly description: string;
  /** テーマカラー。`#3d7e9a` のようなカラーコード */
  readonly themeColor?: string;
  /** アイコン画像のパス */
  readonly iconPath: ReadonlyArray<string>;
  /** ページのアイコン画像のパス。省略時は`iconPath`と同じになる */
  readonly pageIconPath?: ReadonlyArray<string>;
  /** オリジン https://definy-lang.web.app のようなスキーマとドメインとポート番号をまとめたもの */
  readonly origin?: string;
  /** マニフェストのパス */
  readonly manifestPath?: ReadonlyArray<string>;
  /** スタイル。CSS */
  readonly style?: string;
  /** ES Modules形式のJavaScript */
  readonly script?: string;
  /** 中身 */
  readonly body: ReadonlyArray<Element> | string;
};

export const enum Language {
  /** 日本語 `ja` */
  Japanese,
  /** 英語 `en` */
  English
}

const languageToIETFLanguageTag = (language: Language): string => {
  switch (language) {
    case Language.Japanese:
      return "ja";
    case Language.English:
      return "en";
  }
};

export const toString = (html: Html): string =>
  "<!doctype html>" +
  htmlElementToString({
    name: "html",
    attributes: new Map(
      html.language === undefined
        ? []
        : [["lang", languageToIETFLanguageTag(html.language)]]
    ),
    children: {
      _: HtmlElementChildren_.HtmlElementList,
      value: [
        headElement(html),
        {
          name: "body",
          attributes: new Map(),
          children:
            typeof html.body === "string"
              ? {
                  _: HtmlElementChildren_.Text,
                  text: html.body
                }
              : {
                  _: HtmlElementChildren_.HtmlElementList,
                  value: html.body
                }
        }
      ]
    }
  });

const headElement = (html: Html): Element => ({
  name: "head",
  attributes: new Map(),
  children: {
    _: HtmlElementChildren_.HtmlElementList,
    value: [
      charsetElement,
      viewportElement,
      pageNameElement(html.pageName),
      descriptionElement(html.description),
      ...(html.themeColor === undefined
        ? []
        : [themeColorElement(html.themeColor)]),
      iconElement(html.iconPath),
      ...(html.manifestPath === undefined
        ? []
        : [manifestElement(html.manifestPath)]),
      ...(html.style === undefined ? [] : [cssStyleElement(html.style)]),
      ...(html.script === undefined ? [] : [javaScriptElement(html.script)])
    ]
  }
});

const charsetElement: Element = {
  name: "meta",
  attributes: new Map([["charset", "utf-8"]]),
  children: {
    _: HtmlElementChildren_.NoEndTag
  }
};

const viewportElement: Element = {
  name: "meta",
  attributes: new Map([
    ["name", "viewport"],
    ["content", "width=device-width,initial-scale=1.0"]
  ]),
  children: {
    _: HtmlElementChildren_.NoEndTag
  }
};

const pageNameElement = (pageName: string): Element => ({
  name: "title",
  attributes: new Map(),
  children: {
    _: HtmlElementChildren_.Text,
    text: pageName
  }
});

const descriptionElement = (description: string): Element => ({
  name: "meta",
  attributes: new Map([
    ["name", "description"],
    ["content", description]
  ]),
  children: {
    _: HtmlElementChildren_.NoEndTag
  }
});

const themeColorElement = (themeColor: string): Element => ({
  name: "meta",
  attributes: new Map([
    ["name", "theme-color"],
    ["content", themeColor]
  ]),
  children: {
    _: HtmlElementChildren_.NoEndTag
  }
});

const iconElement = (iconPath: ReadonlyArray<string>): Element => ({
  name: "link",
  attributes: new Map([
    ["rel", "icon"],
    ["href", "/" + iconPath.map(escapeUrl).join("/")]
  ]),
  children: {
    _: HtmlElementChildren_.NoEndTag
  }
});

const manifestElement = (path: ReadonlyArray<string>): Element => ({
  name: "link",
  attributes: new Map([
    ["rel", "manifest"],
    ["href", "/" + path.map(escapeUrl).join("/")]
  ]),
  children: {
    _: HtmlElementChildren_.NoEndTag
  }
});

const cssStyleElement = (code: string): Element => ({
  name: "style",
  attributes: new Map(),
  children: {
    _: HtmlElementChildren_.RawText,
    text: code
  }
});

const javaScriptElement = (code: string): Element => ({
  name: "script",
  attributes: new Map([["type", "module"]]),
  children: { _: HtmlElementChildren_.RawText, text: code }
});

const escapeUrl = (text: string): string => {
  return encodeURIComponent(text);
};

const htmlElementToString = (htmlElement: Element): string => {
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
