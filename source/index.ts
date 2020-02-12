import * as fs from "fs";

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
      member: ReadonlyArray<{ name: string; description: string; type: Type }>;
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
      _: CacheType_.Id;
      updateSeconds: number;
    }
  | {
      _: CacheType_.Hash;
    };

const enum CacheType_ {
  Never,
  Id,
  Hash
}

export const cacheNever: CacheType = {
  _: CacheType_.Never
};

export const cacheById = (updateSeconds: number): CacheType => ({
  _: CacheType_.Id,
  updateSeconds
});

export const cacheByHash: CacheType = {
  _: CacheType_.Hash
};

type Output = {
  _id: Id;
  _hash: Hash;
  _readTime: Time;
};

export type Id = string;

export type Hash = string;

type Time = number;

export type ApiFunction = {
  name: string;
  request: Type;
  response: Type;
};

export const generateServerCodeAndUpdateTemplate = (data: {
  functionList: ReadonlyArray<ApiFunction>;
  outputPath: string;
}): Promise<void> =>
  new Promise((resolve, reject) => {
    fs.writeFile(
      data.outputPath,
      'export const middleware = (request, response) => {response.send("ok")}',
      () => {
        resolve();
      }
    );
  });
