import * as ts from "typescript";

export type ServerCode = {
  functions: Map<string, Function>;
  typeDefinitions: Map<string, TypeWithDocument>;
};

export type Function = {
  document: Array<ts.SymbolDisplayPart>;
  arguments: Map<string, Type>;
  return: Type;
};

export type TypeWithDocument = {
  document: Array<ts.SymbolDisplayPart>;
  typeBody: Type;
};

export type Type =
  | {
      type: "object";
      members: Map<string, TypeWithDocument>;
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
