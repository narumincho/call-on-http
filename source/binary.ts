import * as type from "./type";
import * as generator from "js-ts-code-generator";

export const idToArray = (id: string): ReadonlyArray<number> => {
  const binary = [];
  for (let i = 0; i < 16; i++) {
    binary.push(Number.parseInt(id.slice(i * 2, i * 2 + 2), 16));
  }
  return binary;
};
