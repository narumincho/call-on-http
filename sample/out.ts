import * as a from "express";
/**
 * @id 3445f0bff168d2520aa7987d4d838daf
 * patternName=_ patternId=0e391e57e8ca9e79b17cd0a0a97ee930
 *
 */
export type createUserRequest = { name: string; age: string };

/**
 * ミドルウェア
 * @param request リクエスト
 * @param response レスポンス
 */
export const middleware = (request: a.Request, response: a.Response): void => {
  const b: string | undefined = request.headers.accept;
  if (b !== undefined && b.includes("text/html")) {
    response.setHeader("content-type", "text/html");
    response.send(
      '<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>sample apiAPI Document</title><meta name="description" content=""><meta name="theme-color" content="#00ff00"><link rel="icon" href="/"><style>\n    body {\n      margin: 0;\n      background-color: black;\n      color: white;\n    }\n\n    h1 {\n      margin: 0;\n      padding: 1rem;\n    }\n\n    h2 {\n      margin: 0;\n    }\n\n    h3 {\n      margin: 0;\n    }\n\n    section {\n      padding: 1rem;\n    }\n\n    div {\n      padding: 0.5rem;\n      background-color: rgba(100,255,2100, 0.1);\n      overflow-wrap: break-word;\n    }\n    \n    code {\n      white-space: pre-wrap;\n      overflow-wrap: break-word;\n    }\n    </style><meta name="twitter:card" content="summary"><meta property="og:url" content="/"><meta property="og:title" content="sample apiAPI Document"><meta property="og:site_name" content="sample apiAPI Document"><meta property="og:description" content=""><meta property="og:image" content=""><script type="module">;\nexport const createUser=(callback)=>{\n  fetch(location.href,{method:"POST", headers:[["content-type","application/octet-stream"]], body:new Uint8Array([178,194,156,182,44,64,129,233,230,97,49,70,247,174,21,220])}).then((a)=>a.text()).then((a)=>{\n    callback(a);\n  });\n}\n{\n  document.getElementById("request-b2c29cb62c4081e9e6613146f7ae15dc").addEventListener("click",()=>{\n    createUser((a)=>{\n      console.log(a);\n    });\n  });\n}</script></head><body><h1>sample apiAPI Document</h1><section><h2>Function</h2><div><div id="function-b2c29cb62c4081e9e6613146f7ae15dc"><h3>createUser</h3><div>b2c29cb62c4081e9e6613146f7ae15dc</div><div>ユーザーを作成する</div><div><div>request object type</div><div>createUserRequest</div></div><div><div>response object type</div><div>User</div></div><button id="request-b2c29cb62c4081e9e6613146f7ae15dc">Request</button></div></div></section><section><h2>Request Object</h2><div><div><h3>createUserRequest</h3><div>3445f0bff168d2520aa7987d4d838daf</div><div></div><div><div><div>_</div><div>0e391e57e8ca9e79b17cd0a0a97ee930</div><div><div><div>name</div><div>05b4c36276e5c3e5de328d80c93e838f</div><div>名前</div></div><div><div>age</div><div>093ee90c539201b92ad479ba68b5ece7</div><div>年齢</div></div></div></div></div></div></div></section><section><h2>Response Object</h2><div><div id="response-object-User"><h3>User</h3><div>ユーザー</div><div>cacheById freshTime=60s</div><div><div><div>_</div><div>f3da44ff53de8452ea595a2801b57427</div><div><div><div>name</div><div>045f7a3787fd6cf60b02e6cb00deda6d</div><div>名前</div></div><div><div>age</div><div>ed9b3a2d71724911917360da036caa81</div><div>年齢</div></div><div><div>createdAt</div><div>f022c2047b228d9c0e3a1d2f1809d41f</div><div>作成日時</div></div></div></div></div></div></div></section><section><h2>Browser Code TypeScript</h2><code>\n\n/**\n * \n * @param callback \n */\nexport const createUser = (callback: () =&gt; void): void =&gt; {\n  fetch(location.href, { method: &quot;POST&quot;, headers: [[&quot;content-type&quot;, &quot;application/octet-stream&quot;]], body: new Uint8Array([178, 194, 156, 182, 44, 64, 129, 233, 230, 97, 49, 70, 247, 174, 21, 220]) }).then((a: Response): void=&gt;a.text()).then((a: string): void=&gt;{\n    callback(a);\n  });\n}\n</code></section><section><h2>Browser Code JavaScript</h2><code>;\nexport const createUser=(callback)=&gt;{\n  fetch(location.href,{method:&quot;POST&quot;, headers:[[&quot;content-type&quot;,&quot;application/octet-stream&quot;]], body:new Uint8Array([178,194,156,182,44,64,129,233,230,97,49,70,247,174,21,220])}).then((a)=&gt;a.text()).then((a)=&gt;{\n    callback(a);\n  });\n}\n</code></section><noscript>sample apiAPI DocumentではJavaScriptを使用します。ブラウザの設定で有効にしてください。</noscript></body></html>'
    );
    return;
  }
  const c: undefined | Buffer = request.body;
  if (c === undefined) {
    throw new Error(
      "use binary body parser. in middleware app.\n\nconst app = express();\n\napp.use(express.raw());\napp.use(path, out.middleware);"
    );
  }
  const d: Uint8Array = new Uint8Array(c);
  if (
    d[0] === 178 &&
    d[1] === 194 &&
    d[2] === 156 &&
    d[3] === 182 &&
    d[4] === 44 &&
    d[5] === 64 &&
    d[6] === 129 &&
    d[7] === 233 &&
    d[8] === 230 &&
    d[9] === 97 &&
    d[10] === 49 &&
    d[11] === 70 &&
    d[12] === 247 &&
    d[13] === 174 &&
    d[14] === 21 &&
    d[15] === 220
  ) {
    response.send(createUser());
  }
};

/**
 * @id b2c29cb62c4081e9e6613146f7ae15dc
 * ユーザーを作成する

 */
export const createUser = (): string => "編集済み";
