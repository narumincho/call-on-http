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

/**
 * ```ts
 * { result: T, nextIndex: number }
 * ```
 * を表現するコード
 */
export const resultAndNextIndexType = (
  resultType: typeExpr.TypeExpr
): typeExpr.TypeExpr =>
  typeExpr.object(
    new Map([
      ["result", { typeExpr: resultType, document: "" }],
      ["nextIndex", { typeExpr: typeExpr.typeNumber, document: "" }]
    ])
  );

/**
 * UnsignedLeb128で表現されたバイナリをnumberの32bit符号なし整数の範囲の数値にに変換する
 */
export const decodeInt32 = (
  index: number,
  binary: Uint8Array
): { result: number; nextIndex: number } => {
  let result = 0;

  for (let i = 0; i < 5; i++) {
    const b = binary[index + i];

    result |= (b & 0x7f) << (7 * i);
    if ((b & 0x80) === 0 && 0 <= result && result < 2 ** 32 - 1) {
      return { result, nextIndex: index + i + 1 };
    }
  }
  throw new Error("larger than 32-bits");
};

const decodeInt32Name = ["decodeInt32"];
export const decodeInt32Var = expr.localVariable(decodeInt32Name);

/**
 * UnsignedLeb128で表現されたバイナリをnumberの32bit符号なし整数の範囲の数値にに変換するコード
 */
export const decodeInt32Code = expr.functionWithReturnValueVariableDefinition(
  decodeInt32Name,
  [
    { name: ["index"], typeExpr: typeExpr.typeNumber },
    { name: ["binary"], typeExpr: typeExpr.globalType("Uint8Array") }
  ],
  resultAndNextIndexType(typeExpr.typeNumber),
  [
    expr.letVariableDefinition(
      ["result"],
      typeExpr.typeNumber,
      expr.numberLiteral(0)
    ),
    expr.forStatement(["i"], expr.numberLiteral(5), [
      expr.variableDefinition(
        ["b"],
        typeExpr.typeNumber,
        expr.getByExpr(
          expr.localVariable(["binary"]),
          expr.addition(
            expr.localVariable(["index"]),
            expr.localVariable(["i"])
          )
        )
      ),
      expr.set(
        expr.localVariable(["result"]),
        "|",
        expr.leftShift(
          expr.bitwiseAnd(expr.localVariable(["b"]), expr.numberLiteral(0x7f)),
          expr.multiplication(expr.numberLiteral(7), expr.localVariable(["i"]))
        )
      ),
      expr.ifStatement(
        expr.logicalAnd(
          expr.logicalAnd(
            expr.equal(
              expr.bitwiseAnd(
                expr.localVariable(["b"]),
                expr.numberLiteral(0x08)
              ),
              expr.numberLiteral(0)
            ),
            expr.lessThanOrEqual(
              expr.numberLiteral(0),
              expr.localVariable(["result"])
            )
          ),
          expr.lessThan(
            expr.localVariable(["result"]),
            expr.numberLiteral(2 ** 32 - 1)
          )
        ),
        [
          expr.returnStatement(
            expr.objectLiteral(
              new Map([
                ["result", expr.localVariable(["result"])],
                [
                  "nextIndex",
                  expr.addition(
                    expr.addition(
                      expr.localVariable(["index"]),
                      expr.localVariable(["i"])
                    ),
                    expr.numberLiteral(1)
                  )
                ]
              ])
            )
          )
        ]
      )
    ]),
    expr.throwError("larger than 32-bits")
  ]
);

const memberListToObjectTypeExpr = <
  id extends type.RequestObjectId | type.ResponseObjectId
>(
  memberList: ReadonlyArray<type.Member<id>>
): ReadonlyArray<readonly [
  string,
  { typeExpr: typeExpr.TypeExpr; document: string }
]> =>
  memberList.map(member => [
    member.name,
    {
      typeExpr: typeToTypeExpr(member.type),
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
          new Map(
            memberListToObjectTypeExpr<type.RequestObjectId>(pattern.memberList)
          )
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

export const decodeString = (
  index: number,
  binary: Uint8Array
): { result: string; nextIndex: number } => {
  const length = decodeInt32(index, binary);
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

const decodeStringCodeName = ["decodeString"];
export const decodeStringVar = expr.localVariable(decodeStringCodeName);

/**
 * バイナリからstringに変換するコード
 * ブラウザではグローバルの
 * @param textDecoderExpr
 * @param integerDecoderIndex
 */
export const decodeStringCode = (isBrowser: boolean): expr.Statement =>
  expr.functionWithReturnValueVariableDefinition(
    decodeStringCodeName,
    [
      { name: ["index"], typeExpr: typeExpr.typeNumber },
      { name: ["binary"], typeExpr: typeExpr.globalType("Uint8Array") }
    ],
    resultAndNextIndexType(typeExpr.typeString),
    [
      expr.variableDefinition(
        ["length"],
        resultAndNextIndexType(typeExpr.typeNumber),
        expr.call(expr.localVariable(decodeInt32Name), [
          expr.localVariable(["index"]),
          expr.localVariable(["binary"])
        ])
      ),
      expr.returnStatement(
        expr.objectLiteral(
          new Map([
            [
              "result",
              expr.callMethod(
                expr.newExpr(
                  isBrowser
                    ? expr.globalVariable("TextDecoder")
                    : expr.importedVariable("util", "TextDecoder"),
                  []
                ),
                "decode",
                [
                  expr.callMethod(expr.localVariable(["binary"]), "slice", [
                    expr.addition(
                      expr.localVariable(["index"]),
                      expr.get(expr.localVariable(["length"]), "nextIndex")
                    ),
                    expr.addition(
                      expr.addition(
                        expr.localVariable(["index"]),
                        expr.get(expr.localVariable(["length"]), "nextIndex")
                      ),
                      expr.get(expr.localVariable(["length"]), "result")
                    )
                  ])
                ]
              )
            ],
            [
              "nextIndex",
              expr.addition(
                expr.addition(
                  expr.localVariable(["index"]),
                  expr.get(expr.localVariable(["length"]), "nextIndex")
                ),
                expr.get(expr.localVariable(["length"]), "result")
              )
            ]
          ])
        )
      )
    ]
  );

const decodeObjectCodeName = <
  T extends type.RequestObjectId | type.ResponseObjectId
>(
  requestObjectId: T
): ReadonlyArray<string> => ["objectDecode", requestObjectId.toString()];

export const decodeRequestObjectCodeVar = (
  requestObject: type.RequestObject
): expr.Expr => expr.localVariable(decodeObjectCodeName(requestObject.id));

export const decodeRequestObjectCode = (
  requestObject: type.RequestObject
): expr.Statement =>
  expr.functionWithReturnValueVariableDefinition(
    decodeObjectCodeName(requestObject.id),
    [
      {
        name: ["index"],
        typeExpr: typeExpr.typeNumber
      },
      {
        name: ["binary"],
        typeExpr: typeExpr.globalType("Uint8Array")
      }
    ],
    resultAndNextIndexType(typeExpr.globalType(requestObject.name)),
    [
      expr.variableDefinition(
        ["patternIdAndIndex"],
        resultAndNextIndexType(typeExpr.typeNumber),
        expr.call(decodeInt32Var, [
          expr.localVariable(["index"]),
          expr.localVariable(["binary"])
        ])
      ),
      expr.variableDefinition(
        ["patternId"],
        typeExpr.typeNumber,
        expr.get(expr.localVariable(["patternIdAndIndex"]), "result")
      ),
      ...requestObject.patternList.map(pattern =>
        expr.ifStatement(
          expr.equal(
            expr.localVariable(["patternId"]),
            expr.numberLiteral(pattern.id)
          ),
          []
        )
      )
    ]
  );

const decodePatternCode = (pattern: type.Pattern) => {
  pattern.memberList.reduce(
    (beforeIndex, member) => ({
      decodeCode: beforeIndex.decodeCode.concat([
        expr.variableDefinition(
          ["decode", member.id],
          resultAndNextIndexType(32)
        )
      ]),
      beforeIndex: expr.get(expr.localVariable([""]), "nextIndex")
    }),
    {
      decodeCode: [],
      beforeIndex: expr.get(
        expr.localVariable(["patternIdAndIndex"]),
        "nextIndex"
      )
    }
  );
};

export const typeToDecodeVar = <
  T extends type.RequestObjectId | type.ResponseObjectId
>(
  objectType: type.Type<T>
): expr.Expr => {
  switch (objectType._) {
    case type.Type_.Integer:
      return decodeInt32Var;
    case type.Type_.String:
      return decodeStringVar;
    case type.Type_.DateTime:
      return expr.stringLiteral("DateTimeはまだサポートしていない");
    case type.Type_.List:
      return expr.stringLiteral("Listはまだサポートしていない");
    case type.Type_.Id:
      return expr.stringLiteral("IDはまだサポートしていない");
    case type.Type_.Hash:
      return expr.stringLiteral("Hashはまだサポートしていない");
    case type.Type_.Object:
      return expr.localVariable(decodeObjectCodeName(objectType.objectId));
  }
};

export const typeToTypeExpr = <
  T extends type.RequestObjectId | type.ResponseObjectId
>(
  objectType: type.Type<T>
): typeExpr.TypeExpr => {
  switch (objectType._) {
    case type.Type_.Integer:
      return typeExpr.typeNumber;
    case type.Type_.String:
      return typeExpr.typeString;
    case type.Type_.DateTime:
      return typeExpr.globalType("Date");
    case type.Type_.List:
      return typeExpr.withTypeParameter(typeExpr.globalType("ReadonlyArray"), [
        typeToTypeExpr(objectType.type)
      ]);
    case type.Type_.Id:
      return typeExpr.typeNull; // TODO
    case type.Type_.Hash:
      return typeExpr.typeNull; // TODO
    case type.Type_.Object:
      return typeExpr.typeNull; // TODO
  }
};

/*
  {
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
}

*/
