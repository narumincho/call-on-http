import * as crypto from "crypto";

export type Id = string & { _id: never };

export const idFromString = (idAsString: string): Id => {
  if (idAsString.length !== 32) {
    throw new Error("id must be length = 32");
  }
  return idAsString as Id;
};

export const createRandomId = (): Id => {
  return crypto.randomBytes(16).toString("hex") as Id;
};

export type ApiFunction = {
  id: Id;
  name: string;
  description: string;
  request: RequestObject;
  response: ResponseObject;
};

export type RequestType =
  | {
      _: Type_.String;
    }
  | {
      _: Type_.Integer;
    }
  | { _: Type_.Id; typeId: Id }
  | { _: Type_.List; type: RequestType }
  | {
      _: Type_.Object;
      requestObject: RequestObject;
    };

export type RequestObject = {
  id: Id;
  name: string;
  description: string;
  patternList: ReadonlyArray<{
    id: Id;
    name: string;
    member: ReadonlyArray<{
      id: Id;
      name: string;
      description: string;
      type: RequestType;
    }>;
  }>;
};

export type ResponseType =
  | {
      _: Type_.String;
    }
  | {
      _: Type_.Integer;
    }
  | { _: Type_.Id; typeId: Id }
  | { _: Type_.List; type: ResponseType }
  | {
      _: Type_.Object;
      responseObject: ResponseObject;
    };

export type ResponseObject = {
  id: Id;
  name: string;
  description: string;
  cacheType: CacheType;
  patternList: ReadonlyArray<{
    id: Id;
    name: string;
    member: ReadonlyArray<{
      id: Id;
      name: string;
      description: string;
      type: RequestType;
    }>;
  }>;
};

const enum Type_ {
  String,
  Integer,
  List,
  Id,
  Object
}

export const stringType: RequestType & ResponseType = {
  _: Type_.String
};

export const integerType: RequestType & ResponseType = {
  _: Type_.Integer
};

export const idType = (typeId: Id): RequestType & ResponseType => ({
  _: Type_.Id,
  typeId
});

export const requestObjectType = (
  requestObject: RequestObject
): RequestType => ({
  _: Type_.Object,
  requestObject
});

export const responseObjectType = (
  responseObject: ResponseObject
): ResponseType => ({
  _: Type_.Object,
  responseObject
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

const enum CacheType_ {
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
