export type Api = {
  name: string;
  requestObjectList: ReadonlyArray<RequestObject>;
  responseObjectList: ReadonlyArray<ResponseObject>;
  functionList: ReadonlyArray<ApiFunction>;
};

export type FunctionId = string & { _functionId: never };

export type RequestObjectId = string & { _requestObjectId: never };

export type ResponseObjectId = string & { _responseObjectId: never };

export type PatternId = string & { _patternId: never };

export type MemberId = string & { _memberId: never };

export const functionIdFromString = (idAsString: string): FunctionId =>
  idFromString(idAsString) as FunctionId;

export const requestObjectIdFromString = (
  idAsString: string
): RequestObjectId => idFromString(idAsString) as RequestObjectId;

export const responseObjectIdFromString = (
  idAsString: string
): ResponseObjectId => idFromString(idAsString) as ResponseObjectId;

export const patternIdFromString = (idAsString: string): PatternId =>
  idFromString(idAsString) as PatternId;

export const memberIdFromString = (idAsString: string): MemberId =>
  idFromString(idAsString) as MemberId;

const idFromString = (idAsString: string): string => {
  if (idAsString.length !== 32) {
    throw new Error("id length must be 32 id=" + idAsString);
  }
  if (idAsString.match(/[^0123456789abcdef]/) !== null) {
    throw new Error("id contains not 0123456789abcdef id=" + idAsString);
  }
  return idAsString;
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
  patternList: ReadonlyArray<{
    id: PatternId;
    name: string;
    memberList: ReadonlyArray<{
      id: MemberId;
      name: string;
      description: string;
      type: Type<RequestObjectId>;
    }>;
  }>;
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
  patternList: ReadonlyArray<{
    id: PatternId;
    name: string;
    memberList: ReadonlyArray<{
      id: MemberId;
      name: string;
      description: string;
      type: Type<ResponseObjectId>;
    }>;
  }>;
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
        (id as string)
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
      "存在しないRequestObjectIdが使われている requestObjectId=" +
        (id as string)
    );
  }
  return result;
};
