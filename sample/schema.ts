import * as callOnHttp from "../source/index";
import { URL } from "url";

const responseUserTypeId = callOnHttp.type.responseObjectIdFromInteger(0);

const responseUserType: callOnHttp.type.ResponseObject = {
  id: responseUserTypeId,
  name: "User",
  description: "ユーザー",
  cacheType: callOnHttp.type.cacheById(60),
  patternList: [
    {
      id: callOnHttp.type.patternIdFromInteger(0),
      name: "_",
      memberList: [
        {
          name: "name",
          id: callOnHttp.type.memberIdFromInteger(0),
          type: callOnHttp.type.stringType,
          description: "名前"
        },
        {
          name: "age",
          id: callOnHttp.type.memberIdFromInteger(1),
          type: callOnHttp.type.integerType,
          description: "年齢"
        },
        {
          name: "createdAt",
          id: callOnHttp.type.memberIdFromInteger(2),
          type: callOnHttp.type.dateTimeType,
          description: "作成日時"
        }
      ]
    }
  ]
};

const getUserRequestObjectId = callOnHttp.type.requestObjectIdFromInteger(0);

const getUserRequestObject: callOnHttp.type.RequestObject = {
  name: "getUserRequestObject",
  description: "",
  id: getUserRequestObjectId,
  patternList: [
    {
      id: callOnHttp.type.patternIdFromInteger(0),
      name: "_",
      memberList: [
        {
          name: "userId",
          description: "ユーザーID",
          id: callOnHttp.type.memberIdFromInteger(0),
          type: callOnHttp.type.idType(responseUserTypeId)
        }
      ]
    }
  ]
};

const createUserRequestObjectId = callOnHttp.type.requestObjectIdFromInteger(1);

const createUserRequestObject: callOnHttp.type.RequestObject = {
  name: "createUserRequest",
  description: "",
  id: createUserRequestObjectId,
  patternList: [
    {
      id: callOnHttp.type.patternIdFromInteger(0),
      name: "_",
      memberList: [
        {
          name: "name",
          id: callOnHttp.type.memberIdFromInteger(0),
          type: callOnHttp.type.stringType,
          description: "名前"
        },
        {
          name: "age",
          id: callOnHttp.type.memberIdFromInteger(1),
          type: callOnHttp.type.integerType,
          description: "年齢"
        }
      ]
    }
  ]
};

callOnHttp
  .generateServerCodeAndUpdateTemplate(
    {
      name: "sample api",
      url: new URL("http://localhost:8932"),
      requestObjectList: [createUserRequestObject, getUserRequestObject],
      responseObjectList: [responseUserType],
      functionList: [
        {
          id: callOnHttp.type.functionIdFromInteger(0),
          name: "getUser",
          cacheByRequest: true,
          description: "ユーザーの情報を取得する",
          request: getUserRequestObjectId,
          response: responseUserTypeId
        },
        {
          id: callOnHttp.type.functionIdFromInteger(1),
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
  )
  .then(() => {
    console.log("generate code!");
  });
