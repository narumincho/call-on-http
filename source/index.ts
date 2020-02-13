import * as fs from "fs";
import * as type from "./type";
import * as emitter from "./emitter";

export { type };

/*
 *  IDの作成には
 *
 *  コマンドライン
 *  node --eval "console.log(require('crypto').randomBytes(16).toString('hex'))"
 *
 *  ブラウザのコンソール (クリップボードへコピーも行う)
 *  copy([...crypto.getRandomValues(new Uint8Array(16))].map(e=>e.toString(16).padStart(2, "0")).join(""))
 *
 *  を使うと便利
 *
 */

export const generateServerCodeAndUpdateTemplate = (
  apiName: string,
  functionList: ReadonlyArray<type.ApiFunction>,
  serverCodePath: string,
  option: { allowBreakingChange: boolean }
): Promise<void> =>
  new Promise((resolve, reject) => {
    fs.writeFile(serverCodePath, emitter.emit(apiName, functionList), () => {
      resolve();
    });
  });
