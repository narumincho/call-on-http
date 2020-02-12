import * as fs from "fs";
import * as type from "./type";
import * as emitter from "./emitter";

export { type };

type Output = {
  _id: Id;
  _hash: Hash;
  _readTime: Time;
};

export type Id = string;

export type Hash = string;

type Time = number;

export const generateServerCodeAndUpdateTemplate = (
  functionList: ReadonlyArray<type.ApiFunction>,
  serverCodePath: string,
  option: { allowBreakingChange: boolean }
): Promise<void> =>
  new Promise((resolve, reject) => {
    fs.readFile(serverCodePath, { encoding: "utf8" }, (error, code) => {
      console.log(code);
      console.log("ここからID情報を得る");
    });
    fs.writeFile(
      serverCodePath,
      'export const middleware = (request, response) => {response.send("ok")}',
      () => {
        resolve();
      }
    );
  });
