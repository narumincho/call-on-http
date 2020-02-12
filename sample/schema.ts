import * as callOnHttp from "../source/index";

const userTypeName = "User";

const userType: callOnHttp.Type = callOnHttp.objectType({
  name: userTypeName,
  description: "ユーザー",
  cacheType: callOnHttp.cacheById(60),
  member: [
    { name: "name", type: callOnHttp.stringType, description: "名前" },
    { name: "age", type: callOnHttp.integerType, description: "年齢" }
  ]
});

callOnHttp.generateServerCodeAndUpdateTemplate({
  functionList: [
    {
      name: "getUser",
      request: callOnHttp.idType(userTypeName),
      response: userType
    }
  ],
  outputPath: "./sample/out.ts"
});
