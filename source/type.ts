import { URL } from "url";
import { type as nType } from "@narumincho/type";

export type Api = {
  name: string;
  url: URL;
  customTypeList: ReadonlyArray<nType.CustomType>;
  functionList: ReadonlyArray<ApiFunction>;
};

export type FunctionId = number & { _functionId: never };

export const functionIdFromInteger = (idAsInteger: number): FunctionId =>
  idFromNumber(idAsInteger) as FunctionId;

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
  requestType: string;
  responseType: string;
};

const withId = (customTypeName: string): nType.Type =>
  nType.typeCustom(customTypeName + "WithId");

const withHash = (customTypeName: string): nType.Type =>
  nType.typeCustom(customTypeName + "WithHash");

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
