import * as type from "./type";
import * as generator from "js-ts-code-generator";

export const numberToUnsignedLeb128 = (num: number): ReadonlyArray<number> => {
  const numberArray = [];
  while (true) {
    const b = num & 0x7f;
    num = num >>> 7;
    if (num === 0) {
      numberArray.push(b);
      break;
    }
    numberArray.push(b | 0x80);
  }
  return numberArray;
};

export const numberFromUnsignedLeb128 = (
  index: number,
  binary: Uint8Array
): { result: number; nextIndex: number } => {
  let result = 0;

  for (let i = 0; i < 10; i++) {
    const b = binary[index + i];

    result |= (b & 0x7f) << (7 * i);
    if ((b & 0x80) === 0) {
      return { result, nextIndex: index + i + 1 };
    }
  }
  throw new Error("larger than 64-bits");
};

const memberListToObjectTypeExpr = (
  memberList: ReadonlyArray<{
    id: type.MemberId;
    name: string;
    description: string;
    type: type.Type<type.RequestObjectId>;
  }>
): ReadonlyArray<readonly [
  string,
  { typeExpr: generator.typeExpr.TypeExpr; document: string }
]> =>
  memberList.map(member => [
    member.name,
    {
      typeExpr: generator.typeExpr.typeString,
      document: "@id" + member.id.toString() + "\n" + member.description
    }
  ]);
/**
 *  Request Objectから型定義を作成する
 *  ```js
 *  type User = {
 *    name: string,
 *    age: number
 *  }
 *  ```
 *  パターンが複数含まれていた場合
 *  ```ts
 *  export type User =
 *    | { _: User_.Player; name: string; age: number }
 *    | { _: User_.Manager; name: string };
 *
 *  export const enum User_ {
 *    Player,
 *    Manager
 *  }
 *   *  ```
 */
export const requestObjectTypeToTypeAlias = (
  requestObjectType: type.RequestObject
): {
  typeAlias: generator.ExportTypeAlias;
  exportConstEnum: {
    name: string;
    tagNameAndValueList: generator.type.ExportConstEnumTagNameAndValueList;
  } | null;
} => {
  if (requestObjectType.patternList.length === 1) {
    const pattern = requestObjectType.patternList[0];
    return {
      typeAlias: {
        name: requestObjectType.name,
        document:
          "@id " +
          requestObjectType.id.toString() +
          "\npatternName=" +
          pattern.name +
          " patternId=" +
          pattern.id.toString() +
          "\n" +
          requestObjectType.description,
        typeExpr: generator.typeExpr.object(
          new Map(memberListToObjectTypeExpr(pattern.memberList))
        )
      },
      exportConstEnum: null
    };
  }
  return {
    typeAlias: {
      name: requestObjectType.name,
      document:
        "@id" +
        requestObjectType.id.toString() +
        "\n" +
        requestObjectType.description,
      typeExpr: generator.typeExpr.union(
        requestObjectType.patternList.map(pattern =>
          generator.typeExpr.object(
            new Map(
              [
                [
                  "_",
                  {
                    typeExpr: generator.typeExpr.typeString,
                    document: ""
                  }
                ] as readonly [
                  string,
                  { typeExpr: generator.typeExpr.TypeExpr; document: string }
                ]
              ].concat(memberListToObjectTypeExpr(pattern.memberList))
            )
          )
        )
      )
    },
    exportConstEnum: {
      name: requestObjectType.name + "_",
      tagNameAndValueList: new Map(
        requestObjectType.patternList.map(pattern => [pattern.name, pattern.id])
      )
    }
  };
};
