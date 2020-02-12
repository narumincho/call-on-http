import * as crypto from "crypto";

export type Id = string & { _id: never };

export const createRandomId = (): Id => {
  return crypto.randomBytes(16).toString("hex") as Id;
};

export type ApiFunction = {
  id: Id;
  name: string;
  input: Type | null;
  output: Type;
};

export type Type =
  | {
      _: Type_.String;
    }
  | {
      _: Type_.Integer;
    }
  | { _: Type_.Id; typeName: string }
  | {
      _: Type_.Object;
      name: string;
      description: string;
      cacheType: CacheType;
      member: ReadonlyArray<{
        id: Id;
        name: string;
        description: string;
        type: Type;
      }>;
    };

const enum Type_ {
  String,
  Integer,
  Id,
  Object
}

export const stringType: Type = {
  _: Type_.String
};

export const integerType: Type = {
  _: Type_.Integer
};

export const idType = (typeName: string): Type => ({
  _: Type_.Id,
  typeName
});

export const objectType = (data: {
  name: string;
  description: string;
  cacheType: CacheType;
  member: ReadonlyArray<{ name: string; description: string; type: Type }>;
}): Type => ({
  _: Type_.Object,
  ...data
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
