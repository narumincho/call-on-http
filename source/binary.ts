import * as type from "./type";
import * as generator from "js-ts-code-generator";
import { expr, typeExpr } from "js-ts-code-generator";
import { TextDecoder } from "util";

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
  { typeExpr: typeExpr.TypeExpr; document: string }
]> =>
  memberList.map(member => [
    member.name,
    {
      typeExpr: typeExpr.typeString,
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
        typeExpr: typeExpr.object(
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
      typeExpr: typeExpr.union(
        requestObjectType.patternList.map(pattern =>
          typeExpr.object(
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

const stringDecoder = (
  index: number,
  binary: Uint8Array
): { result: string; nextIndex: number } => {
  const length = numberFromUnsignedLeb128(index, binary);
  return {
    result: new TextDecoder().decode(
      binary.slice(
        index + length.nextIndex,
        index + length.nextIndex + length.result
      )
    ),
    nextIndex: index + length.nextIndex + length.result
  };
};

export const stringDecoderCode = (
  textDecoderExpr: generator.expr.Expr,
  integerDecoderIndex: number
): generator.expr.Statement =>
  generator.expr.functionWithReturnValueVariableDefinition(
    [typeExpr.typeNumber, typeExpr.globalType("Uint8Array")],
    typeExpr.object(
      new Map([
        ["result", { typeExpr: typeExpr.typeString, document: "" }],
        ["nextIndex", { typeExpr: typeExpr.typeNumber, document: "" }]
      ])
    ),
    [
      expr.variableDefinition(
        typeExpr.object(
          new Map([
            ["result", { typeExpr: typeExpr.typeNumber, document: "" }],
            ["nextIndex", { typeExpr: typeExpr.typeNumber, document: "" }]
          ])
        ),
        expr.call(expr.localVariable(1, integerDecoderIndex), [
          expr.argument(0, 0),
          expr.argument(0, 1)
        ])
      ),
      expr.returnStatement(
        expr.objectLiteral(
          new Map([
            [
              "result",
              expr.callMethod(expr.newExpr(textDecoderExpr, []), "decode", [
                expr.callMethod(expr.argument(0, 1), "slice", [
                  expr.addition(
                    expr.argument(0, 0),
                    expr.get(expr.localVariable(0, 0), "nextIndex")
                  ),
                  expr.addition(
                    expr.addition(
                      expr.argument(0, 0),
                      expr.get(expr.localVariable(0, 0), "nextIndex")
                    ),
                    expr.get(expr.localVariable(0, 0), "result")
                  )
                ])
              ])
            ],
            [
              "nextIndex",
              expr.addition(
                expr.addition(
                  expr.argument(0, 0),
                  expr.get(expr.localVariable(0, 0), "nextIndex")
                ),
                expr.get(expr.localVariable(0, 0), "result")
              )
            ]
          ])
        )
      )
    ]
  );

/*
const binaryToRequestObject = (
  index: number,
  binary: Uint8Array
): { result: object; nextIndex: number } => {
  const patternIdAndNextIndex = numberFromUnsignedLeb128(index, binary);
  const patternId = patternIdAndNextIndex.result;
  if (patternId === 0) {
    const nameAndNextIndex = stringDecoder(
      patternIdAndNextIndex.nextIndex,
      binary
    );
    const ageAndNextIndex = numberFromUnsignedLeb128(
      nameAndNextIndex.nextIndex,
      binary
    );
    const result = createUser(
      nameAndNextIndex.result,
      ageAndNextIndex.nextIndex
    );
  }
};

*/
