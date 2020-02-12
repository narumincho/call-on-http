import * as callOnHttp from "../source/index";

const responseUserTypeId = callOnHttp.type.idFromString(
  "ec50f1628ff9bac06020a522855669be"
);

const responseUserType: callOnHttp.type.RequestType = callOnHttp.type.responseObjectType(
  {
    id: responseUserTypeId,
    name: "User",
    description: "ユーザー",
    cacheType: callOnHttp.type.cacheById(60),
    patternList: [
      {
        id: callOnHttp.type.idFromString("f3da44ff53de8452ea595a2801b57427"),
        name: "_",
        member: [
          {
            name: "name",
            id: callOnHttp.type.idFromString(
              "045f7a3787fd6cf60b02e6cb00deda6d"
            ),
            type: callOnHttp.type.stringType,
            description: "名前"
          },
          {
            name: "age",
            id: callOnHttp.type.idFromString(
              "ed9b3a2d71724911917360da036caa81"
            ),
            type: callOnHttp.type.integerType,
            description: "年齢"
          }
        ]
      }
    ]
  }
);

callOnHttp.generateServerCodeAndUpdateTemplate(
  [
    {
      name: "getUser",
      request: callOnHttp.type.idType(responseUserTypeId),
      response: responseUserType,
      id: callOnHttp.type.idFromString("b2c29cb62c4081e9e6613146f7ae15dc")
    }
  ],
  "./sample/out.ts",
  { allowBreakingChange: false }
);
