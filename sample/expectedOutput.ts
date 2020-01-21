import * as express from "express";
import * as api from "api";

/**
 * expressでよく使われるミドルウェア
 * @param response レスポンス
 * @param request リクエスト
 */
const middleware = (
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
  const b = new Uint8Array(body as Buffer);
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
