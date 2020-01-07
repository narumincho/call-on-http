import * as tsm from "ts-morph";

export type ServerCode = {
  functions: Map<string, FunctionData>;
  typeDefinitions: Map<string, TypeData>;
};

export type FunctionData = {
  document: ReadonlyArray<tsm.JSDoc>;
  parameters: ReadonlyArray<[string, Type]>;
  return: Type;
};

export type TypeData = {
  document: Array<tsm.JSDoc>;
  typeBody: Type;
};

export type Type =
  | {
      type: "object";
      members: Map<string, TypeData>;
    }
  | { type: "referenceInServerCode"; name: string }
  | { type: "primitive"; primitive: PrimitiveType }
  | { type: "union"; types: ReadonlyArray<Type> };

export type PrimitiveType =
  | "string"
  | "number"
  | "boolean"
  | "undefined"
  | "null"
  | "never";
