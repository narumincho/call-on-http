import * as callOnHttp from "../source/index";

const responseUserTypeId = callOnHttp.type.responseObjectIdFromString(
  "ec50f1628ff9bac06020a522855669be"
);

const responseUserType: callOnHttp.type.ResponseObject = {
  id: responseUserTypeId,
  name: "User",
  description: "ユーザー",
  cacheType: callOnHttp.type.cacheById(60),
  patternList: [
    {
      id: callOnHttp.type.patternIdFromString(
        "f3da44ff53de8452ea595a2801b57427"
      ),
      name: "_",
      memberList: [
        {
          name: "name",
          id: callOnHttp.type.memberIdFromString(
            "045f7a3787fd6cf60b02e6cb00deda6d"
          ),
          type: callOnHttp.type.stringType,
          description: "名前"
        },
        {
          name: "age",
          id: callOnHttp.type.memberIdFromString(
            "ed9b3a2d71724911917360da036caa81"
          ),
          type: callOnHttp.type.integerType,
          description: "年齢"
        },
        {
          name: "createdAt",
          id: callOnHttp.type.memberIdFromString(
            "f022c2047b228d9c0e3a1d2f1809d41f"
          ),
          type: callOnHttp.type.dateTimeType,
          description: "作成日時"
        }
      ]
    }
  ]
};

const createUserRequestObjectId = callOnHttp.type.requestObjectIdFromString(
  "3445f0bff168d2520aa7987d4d838daf"
);

const createUserRequestObject: callOnHttp.type.RequestObject = {
  name: "createUserRequest",
  description: "",
  id: createUserRequestObjectId,
  patternList: [
    {
      id: callOnHttp.type.patternIdFromString(
        "0e391e57e8ca9e79b17cd0a0a97ee930"
      ),
      name: "_",
      memberList: [
        {
          name: "name",
          id: callOnHttp.type.memberIdFromString(
            "05b4c36276e5c3e5de328d80c93e838f"
          ),
          type: callOnHttp.type.stringType,
          description: "名前"
        },
        {
          name: "age",
          id: callOnHttp.type.memberIdFromString(
            "093ee90c539201b92ad479ba68b5ece7"
          ),
          type: callOnHttp.type.integerType,
          description: "年齢"
        }
      ]
    }
  ]
};

callOnHttp.generateServerCodeAndUpdateTemplate(
  {
    name: "sample api",
    requestObjectList: [createUserRequestObject],
    responseObjectList: [responseUserType],
    functionList: [
      {
        id: callOnHttp.type.functionIdFromString(
          "b2c29cb62c4081e9e6613146f7ae15dc"
        ),
        name: "createUser",
        cacheByRequest: false,
        description: "ユーザーを作成する",
        request: createUserRequestObjectId,
        response: responseUserTypeId
      }
    ]
  },
  "./sample/out.ts",
  { allowBreakingChange: false }
);
