import * as a from "express";
/**
 * @id 1
 * patternName=_ patternId=0
 * 
 */
export type createUserRequest = {name: string, age: string};
/**
 * @id 0
 * patternName=_ patternId=0
 * 
 */
export type getUserRequestObject = {userId: string}

/**
 * ミドルウェア
 * @param request リクエスト
 * @param response レスポンス
 */
export const middleware = (request: a.Request, response: a.Response): void => {
  const b:string | undefined = request.headers.accept;
  if (b !== undefined && b.includes("text/html")) {
    response.setHeader("content-type", "text/html");
    response.send("<!doctype html><html lang=\"ja\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1.0\"><title>sample apiAPI Document</title><meta name=\"description\" content=\"\"><meta name=\"theme-color\" content=\"#00ff00\"><link rel=\"icon\" href=\"/\"><style>\n    body {\n      margin: 0;\n      background-color: black;\n      color: white;\n    }\n\n    h1 {\n      margin: 0;\n      padding: 1rem;\n    }\n\n    h2 {\n      margin: 0;\n    }\n\n    h3 {\n      margin: 0;\n    }\n\n    section {\n      padding: 1rem;\n    }\n\n    div {\n      padding: 0.5rem;\n      background-color: rgba(100,255,2100, 0.1);\n      overflow-wrap: break-word;\n    }\n    \n    code {\n      white-space: pre-wrap;\n      overflow-wrap: break-word;\n    }\n    </style><meta name=\"twitter:card\" content=\"summary\"><meta property=\"og:url\" content=\"/\"><meta property=\"og:title\" content=\"sample apiAPI Document\"><meta property=\"og:site_name\" content=\"sample apiAPI Document\"><meta property=\"og:description\" content=\"\"><meta property=\"og:image\" content=\"\"><script type=\"module\">export const getUser=(callback)=>{\n  fetch(\"http://localhost:8932/\",{method:\"POST\", headers:[[\"content-type\",\"application/octet-stream\"]], body:new Uint8Array([0])}).then((a)=>a.text()).then((a)=>{\n    callback(a);\n  });\n}\n\nexport const createUser=(callback)=>{\n  fetch(\"http://localhost:8932/\",{method:\"POST\", headers:[[\"content-type\",\"application/octet-stream\"]], body:new Uint8Array([1])}).then((a)=>a.text()).then((a)=>{\n    callback(a);\n  });\n}\n{\n  document.getElementById(\"request-0\").addEventListener(\"click\",()=>{\n    getUser((a)=>{\n      console.log(a);\n    });\n  });\n  document.getElementById(\"request-1\").addEventListener(\"click\",()=>{\n    createUser((a)=>{\n      console.log(a);\n    });\n  });\n}</script></head><body><h1>sample apiAPI Document</h1><section><h2>Function</h2><div><div id=\"function-0\"><h3>getUser</h3><div>0</div><div>ユーザーの情報を取得する</div><div><div>request object type</div><div>getUserRequestObject</div></div><div><div>response object type</div><div>User</div></div><button id=\"request-0\">Request</button></div><div id=\"function-1\"><h3>createUser</h3><div>1</div><div>ユーザーを作成する</div><div><div>request object type</div><div>createUserRequest</div></div><div><div>response object type</div><div>User</div></div><button id=\"request-1\">Request</button></div></div></section><section><h2>Request Object</h2><div><div><h3>createUserRequest</h3><div>1</div><div></div><div><div><div>_</div><div>0</div><div><div><div>name</div><div>0</div><div>名前</div><div>string</div></div><div><div>age</div><div>1</div><div>年齢</div><div>integer</div></div></div></div></div></div><div><h3>getUserRequestObject</h3><div>0</div><div></div><div><div><div>_</div><div>0</div><div><div><div>userId</div><div>0</div><div>ユーザーID</div><div>User-id</div></div></div></div></div></div></div></section><section><h2>Response Object</h2><div><div id=\"response-object-User\"><h3>User</h3><div>ユーザー</div><div>cacheById freshTime=60s</div><div><div><div>_</div><div>0</div><div><div><div>name</div><div>0</div><div>名前</div><div>string</div></div><div><div>age</div><div>1</div><div>年齢</div><div>integer</div></div><div><div>createdAt</div><div>2</div><div>作成日時</div><div>dateTime</div></div></div></div></div></div></div></section><section><h2>Browser Code TypeScript</h2><code>\n\n/**\n * \n * @param callback \n */\nexport const getUser = (callback: () =&gt; void): void =&gt; {\n  fetch(&quot;http://localhost:8932/&quot;, { method: &quot;POST&quot;, headers: [[&quot;content-type&quot;, &quot;application/octet-stream&quot;]], body: new Uint8Array([0]) }).then((a: Response): void=&gt;a.text()).then((a: string): void=&gt;{\n    callback(a);\n  });\n}\n\n/**\n * \n * @param callback \n */\nexport const createUser = (callback: () =&gt; void): void =&gt; {\n  fetch(&quot;http://localhost:8932/&quot;, { method: &quot;POST&quot;, headers: [[&quot;content-type&quot;, &quot;application/octet-stream&quot;]], body: new Uint8Array([1]) }).then((a: Response): void=&gt;a.text()).then((a: string): void=&gt;{\n    callback(a);\n  });\n}\n</code></section><section><h2>Browser Code JavaScript</h2><code>export const getUser=(callback)=&gt;{\n  fetch(&quot;http://localhost:8932/&quot;,{method:&quot;POST&quot;, headers:[[&quot;content-type&quot;,&quot;application/octet-stream&quot;]], body:new Uint8Array([0])}).then((a)=&gt;a.text()).then((a)=&gt;{\n    callback(a);\n  });\n}\n\nexport const createUser=(callback)=&gt;{\n  fetch(&quot;http://localhost:8932/&quot;,{method:&quot;POST&quot;, headers:[[&quot;content-type&quot;,&quot;application/octet-stream&quot;]], body:new Uint8Array([1])}).then((a)=&gt;a.text()).then((a)=&gt;{\n    callback(a);\n  });\n}\n</code></section><noscript>sample apiAPI DocumentではJavaScriptを使用します。ブラウザの設定で有効にしてください。</noscript></body></html>");
    return;
  }
  const c:undefined | Buffer = request.body;
  if (c === undefined) {
    throw new Error("use binary body parser. in middleware app.\n\nconst app = express();\n\napp.use(express.raw());\napp.use(path, out.middleware);");
  }
  const d:Uint8Array = new Uint8Array(c);
  const e = (h:number, i:Uint8Array): {result: number, nextIndex: number}=>{
    "ここにちゃんとした実装を書くべし";
    return{ result: 0, nextIndex: 1 };
  };
  const f:{result: number, nextIndex: number} = e(0, d);
  const g:number = f.result;
  if (0 === g) {
    response.send(getUser());
  }
  if (1 === g) {
    response.send(createUser());
  }
}

/**
 * @id 0
 * ユーザーの情報を取得する

 */
export const getUser = (): string => "getUser@0"

/**
 * @id 1
 * ユーザーを作成する

 */
export const createUser = (): string => "createUser@1"
