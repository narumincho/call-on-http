import * as type from "./type";
import * as generator from "jstscodegenerator";
import * as fs from "fs";

export const emit = (
  serverCode: type.ServerCode,
  outFileName: string
): Promise<void> =>
  new Promise((resolve, reject) => {
    const expressModule = generator.createImportNodeModule<
      ["Request", "Response"],
      []
    >("express", ["Request", "Response"], []);
    const nodeJsCode: generator.NodeJsCode = {
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
    };
    fs.writeFile(
      outFileName,
      generator.toNodeJsCodeAsTypeScript(nodeJsCode),
      () => {
        resolve();
      }
    );
  });
