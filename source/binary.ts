import * as type from "./type";
import * as generator from "js-ts-code-generator";

export const idToArray = (id: string): ReadonlyArray<number> => {
  const binary = [];
  for (let i = 0; i < 16; i++) {
    binary.push(Number.parseInt(id.slice(i * 2, i * 2 + 2), 16));
  }
  return binary;
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
      document: "@id" + (member.id as string) + "\n" + member.description
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
  exportConstEnum: generator.ExportConstEnum | null;
} => {
  if (requestObjectType.patternList.length === 1) {
    const pattern = requestObjectType.patternList[0];
    return {
      typeAlias: {
        name: requestObjectType.name,
        document:
          "@id " +
          (requestObjectType.id as string) +
          "\npatternName=" +
          pattern.name +
          " patternId=" +
          (pattern.id as string) +
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
        (requestObjectType.id as string) +
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
      patternList: requestObjectType.patternList.map(pattern => pattern.name)
    }
  };
};
