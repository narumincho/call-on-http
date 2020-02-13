import * as express from "express";
import * as api from "api";
import * as crypto from "crypto";

/**
 * expressでよく使われるミドルウェア
 * @param response レスポンス
 * @param request リクエスト
 */
export const middleware = (
  request: express.Request,
  response: express.Response
): void => {
  const accept = request.headers.accept;
  if (accept !== undefined && accept.includes("text/html")) {
    response.setHeader("content-type", "text/html");
    response.send(`
<!doctype html>
<html lang="en">
<head>
    <meta charset=..
    <script type="module">
        const callOnHttpBinaryToId = (id) => {
            return id
        }

        const callOnHttpBinaryToId = (binary) => {

        }

        const getUser = (id) => new Promise(()=>{
            fetch(idToCallOnHttpBinary(id)).then(e=>{
                resolve(callOnHttpBinaryToId(e))
            })
        })
    </script>
</head>

<body>
    <h1>Call On Http Server</h1>
    <div>
        <h2>getUser</h2>
        <div>
            parameter...
        </div>
    </div>
</body>
</html>
`);
    return;
  }
  const body = request.body;
  if (body === undefined) {
    throw new Error(`
use binary body parser. in middleware app.

const app = express();

app.use(express.raw());
app.use(path, out.middleware);
`);
  }
  const b = new Uint8Array(body as Buffer | Uint8Array);
  if (b[0] !== 23 || b[1] !== 32) {
    response.status(400);
    response.send("api updated. use new client code at " + request.url);
    return;
  }
  const decodeInt = (
    binary: Uint8Array,
    index: number
  ): { int: number; nextIndex: number } => ({
    int: 32,
    nextIndex: 43
  });
  const decodeId = (
    binary: Uint8Array,
    index: number
  ): { id: string; nextIndex: number } => {
    return {
      id: "",
      nextIndex: index
    };
  };
  const encodeId = (id: string): Array<number> => {
    return [];
  };
  const functionIndexData = decodeInt(b, 32);
  const functionIndex = functionIndexData.int;
  if (functionIndex === 0) {
    api(decodeId(b, functionIndexData.nextIndex)).then(result => {
      response.send(encodeId(result));
    });
    return;
  }
  response.status(400);
  response.send("invalid function index. index=" + functionIndex);
};

const createRandomId = (): string => {
  return crypto.randomBytes(16).toString("hex");
};

type UserId = string & { _580d8d6a54cf43e4452a0bba6694a4ed: never };

/**
 * @id f4b44edab5e16b5f05786038d247ca2e
 *
 * ユーザー
 */
type User = {
  _id: UserId;
  /**
   * @id bfb01ad37fee7368cd3f82f1536b8136
   *
   * 名前
   */
  name: string;
  /**
   * @id cffd0fe1c1421fb3e5a123a9b4e97ff4
   *
   * 年齢
   */
  age: number;
  _readTime: Date;
};

type ImageId = string & { _4763daedf5827ab4a2e2ff064bd905eb: never };

type Image = {
  /**
   * @id 32fd9e95b400a294393d5ccfb25c103d
   */
  data: Uint8Array;
};

/* =================================================
 *           この下のコードを書き換えてください
 * =================================================
 */

/**
 * @id e826237c70da15fd80cc03dfeb0985d4
 *
 * ユーザの情報を取得する
 */

const getUser = (request: UserId): Promise<User> => {
  return {
    _id: request,
    name: "sample text",
    age: 28,
    _readTime: new Date()
  };
};

/**
 * @id e826237c70da15fd80cc03dfeb0985d4
 *
 * ユーザの情報を取得する
 */

const getImage = (request: UserId): Promise<User> => {
  return {
    _id: request,
    name: "sample text",
    age: 28,
    _readTime: new Date()
  };
};

/** =======================================
 *           書き換えるコード終了
 * =======================================
 */
