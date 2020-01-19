import * as type from "./type";
import * as tsm from "ts-morph";
import * as generator from "jstscodegenerator";
import * as fs from "fs";

const typeToString = (type: type.Type): string => {
  switch (type.type) {
    case "object": {
      return (
        "{" +
        type.members
          .map(
            ([name, typeData]) => name + ": " + typeToString(typeData.typeData)
          )
          .join(",") +
        "}"
      );
    }
    case "primitive": {
      switch (type.primitive) {
        case "string":
          return "string";
        case "number":
          return "number";
        case "boolean":
          return "boolean";
        case "undefined":
          return "undefined";
        case "null":
          return "null";
      }
    }
  }
  return "number";
};

export const emit = (
  serverCode: type.ServerCode,
  outFileName: string
): Promise<void> =>
  new Promise((resolve, reject) => {
    const expressModule = generator.createImportNodeModule<
      ["Request", "Response"],
      []
    >("express", ["Request", "Response"], []);
    const project = new tsm.Project({
      compilerOptions: {
        strict: true
      }
    });
    fs.writeFile(
      outFileName,
      generator.toNodeJsCodeAsTypeScript({
        exportTypeAliasList: [],
        exportVariableList: [
          {
            name: "middleware",
            typeExpr: generator.typeExpr.functionReturnVoid([
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
            ]),
            document: "ミドルウェア",
            expr: generator.stringLiteral("まだ途中")
          }
        ]
      }),
      () => {
        resolve();
      }
    );
  });
