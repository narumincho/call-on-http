import { URL } from "url";

export type Api = {
  name: string;
  url: URL;
  requestObjectList: ReadonlyArray<RequestObject>;
  responseObjectList: ReadonlyArray<ResponseObject>;
  functionList: ReadonlyArray<ApiFunction>;
};

export type FunctionId = number & { _functionId: never };

export type RequestObjectId = number & { _requestObjectId: never };

export type ResponseObjectId = number & { _responseObjectId: never };

export type PatternId = number & { _patternId: never };

export type MemberId = number & { _memberId: never };

export const functionIdFromInteger = (idAsInteger: number): FunctionId =>
  idFromNumber(idAsInteger) as FunctionId;

export const requestObjectIdFromInteger = (
  idAsInteger: number
): RequestObjectId => idFromNumber(idAsInteger) as RequestObjectId;

export const responseObjectIdFromInteger = (
  idAsInteger: number
): ResponseObjectId => idFromNumber(idAsInteger) as ResponseObjectId;

export const patternIdFromInteger = (idAsInteger: number): PatternId =>
  idFromNumber(idAsInteger) as PatternId;

export const memberIdFromInteger = (idAsInteger: number): MemberId =>
  idFromNumber(idAsInteger) as MemberId;

const idFromNumber = (idAsNumber: number): number => {
  if (Number.isNaN(idAsNumber)) {
    throw new Error("id must be not NaN");
  }
  if (!Number.isInteger(idAsNumber)) {
    throw new Error("id must be integer id=" + idAsNumber.toString());
  }
  if (idAsNumber < 0) {
    throw new Error(
      "id must be greater than or equal to 0. id=" + idAsNumber.toString()
    );
  }
  if (2 ** 31 - 1 < idAsNumber) {
    throw new Error(
      "id must be less than 2147483648. id=" + idAsNumber.toString()
    );
  }
  return idAsNumber;
};

export type ApiFunction = {
  id: FunctionId;
  name: string;
  description: string;
  cacheByRequest: boolean;
  request: RequestObjectId;
  response: ResponseObjectId;
};

export type RequestObject = {
  id: RequestObjectId;
  name: string;
  description: string;
  patternList: ReadonlyArray<Pattern<RequestObjectId>>;
};

export type Pattern<id extends RequestObjectId | ResponseObjectId> = {
  id: PatternId;
  name: string;
  memberList: ReadonlyArray<Member<id>>;
};

export type Member<id extends RequestObjectId | ResponseObjectId> = {
  id: MemberId;
  name: string;
  description: string;
  type: Type<id>;
};

export type Type<id extends RequestObjectId | ResponseObjectId> =
  | {
      _: Type_.String;
    }
  | {
      _: Type_.Integer;
    }
  | {
      _: Type_.DateTime;
    }
  | { _: Type_.List; type: Type<id> }
  | { _: Type_.Id; responseObjectId: ResponseObjectId }
  | { _: Type_.Hash; responseObjectId: ResponseObjectId }
  | {
      _: Type_.Object;
      objectId: id;
    };

export type ResponseObject = {
  id: ResponseObjectId;
  name: string;
  description: string;
  cacheType: CacheType;
  patternList: ReadonlyArray<Pattern<ResponseObjectId>>;
};

export const enum Type_ {
  String,
  Integer,
  DateTime,
  List,
  Id,
  Hash,
  Object
}

export const stringType: Type<RequestObjectId & ResponseObjectId> = {
  _: Type_.String
};

export const integerType: Type<RequestObjectId & ResponseObjectId> = {
  _: Type_.Integer
};

export const dateTimeType: Type<RequestObjectId & ResponseObjectId> = {
  _: Type_.DateTime
};

export const requestListType = (
  requestType: Type<RequestObjectId>
): Type<RequestObjectId> => ({
  _: Type_.List,
  type: requestType
});

export const responseListType = (
  responseType: Type<ResponseObjectId>
): Type<ResponseObjectId> => ({
  _: Type_.List,
  type: responseType
});

export const idType = (
  responseObjectId: ResponseObjectId
): Type<RequestObjectId & ResponseObjectId> => ({
  _: Type_.Id,
  responseObjectId
});

export const hashType = (
  responseObjectId: ResponseObjectId
): Type<RequestObjectId & ResponseObjectId> => ({
  _: Type_.Hash,
  responseObjectId
});

export const requestObjectType = (
  objectId: RequestObjectId
): Type<RequestObjectId> => ({
  _: Type_.Object,
  objectId
});

export const responseObjectType = (
  objectId: ResponseObjectId
): Type<ResponseObjectId> => ({
  _: Type_.Object,
  objectId
});

export type CacheType =
  | {
      _: CacheType_.Never;
    }
  | {
      _: CacheType_.CacheById;
      freshSeconds: number;
    }
  | {
      _: CacheType_.cacheByHash;
    };

export const enum CacheType_ {
  Never,
  CacheById,
  cacheByHash
}

export const cacheNever: CacheType = {
  _: CacheType_.Never
};

export const cacheById = (updateSeconds: number): CacheType => ({
  _: CacheType_.CacheById,
  freshSeconds: updateSeconds
});

export const cacheByHash: CacheType = {
  _: CacheType_.cacheByHash
};

export const getResponseObject = (
  id: ResponseObjectId,
  list: ReadonlyArray<ResponseObject>
): ResponseObject => {
  const result = list.find(responseObject => responseObject.id === id);
  if (result === undefined) {
    throw new Error(
      "存在しないResponseObjectIdが使われている responseObjectId=" +
        id.toString()
    );
  }
  return result;
};

export const getRequestObject = (
  id: RequestObjectId,
  list: ReadonlyArray<RequestObject>
): RequestObject => {
  const result = list.find(requestObject => requestObject.id === id);
  if (result === undefined) {
    throw new Error(
      "存在しないRequestObjectIdが使われている requestObjectId=" + id.toString()
    );
  }
  return result;
};
