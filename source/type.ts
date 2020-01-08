import * as tsm from "ts-morph";

export type ServerCode = {
  functions: Map<string, FunctionData>;
  typeDefinitions: Map<string, TypeData>;
};

export type FunctionData = {
  document: Array<string>;
  parameters: ReadonlyArray<[string, Type]>;
  return: Type;
};

export type TypeData = {
  document: Array<string>;
  typeData: Type;
};

export type Type =
  | {
      type: "object";
      members: ReadonlyArray<[string, TypeData]>;
    }
  | { type: "referenceInServerCode"; name: string }
  | { type: "primitive"; primitive: PrimitiveType }
  | { type: "union"; types: ReadonlyArray<Type> };

export type PrimitiveType =
  | "string"
  | "number"
  | "boolean"
  | "undefined"
  | "null";
