import * as callOnHttp from "../source/index";

const userTypeName = "User";

const userType: callOnHttp.type.Type = callOnHttp.type.objectType({
  name: userTypeName,
  description: "ユーザー",
  cacheType: callOnHttp.type.cacheById(60),
  member: [
    { name: "name", type: callOnHttp.type.stringType, description: "名前" },
    { name: "age", type: callOnHttp.type.integerType, description: "年齢" }
  ]
});

callOnHttp.generateServerCodeAndUpdateTemplate(
  [
    {
      name: "getUser",
      request: callOnHttp.type.idType(userTypeName),
      response: userType
    }
  ],
  "./sample/out.ts"
);
