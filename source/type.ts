export type ServerCode = {
  apiName: string;
  functionMap: Map<string, FunctionData>;
  typeMap: Map<string, TypeData>;
};

export type FunctionData = {
  document: string;
  parameters: ReadonlyArray<[string, Type]>;
  return: Type;
};

export type TypeData = {
  document: string;
  type_: Type;
};

export type Type =
  | { _: Type_.String }
  | { _: Type_.Number }
  | { _: Type_.Boolean }
  | { _: Type_.Undefined }
  | { _: Type_.Null }
  | {
      _: Type_.Object;
      members: ReadonlyArray<[string, { document: string; type_: Type }]>;
    }
  | { _: Type_.Reference; name: string }
  | { _: Type_.Union; typeList: ReadonlyArray<Type> };

export const enum Type_ {
  String,
  Number,
  Boolean,
  Undefined,
  Null,
  Object,
  Reference,
  Union
}
