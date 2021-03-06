import * as type from "./type";
import * as generator from "js-ts-code-generator";
import { expr, typeExpr } from "js-ts-code-generator";
import { TextDecoder } from "util";

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
 * ```ts
 * return { result: resultExpr, nextIndex: nextIndexExpr }
 * ```
 * を表現するコード
 */
export const resultAndNextIndexReturnStatement = (
  resultExpr: expr.Expr,
  nextIndexExpr: expr.Expr
): expr.Statement =>
  expr.returnStatement(
    expr.objectLiteral(
      new Map([
        ["result", resultExpr],
        ["nextIndex", nextIndexExpr]
      ])
    )
  );

/**
 * `ReadonlyArray<number>`
 * を表現する
 */
const readonlyArrayNumber: typeExpr.TypeExpr = typeExpr.withTypeParameter(
  typeExpr.globalType("ReadonlyArray"),
  [typeExpr.typeNumber]
);

const decodeParameterList: ReadonlyArray<{
  name: ReadonlyArray<string>;
  typeExpr: typeExpr.TypeExpr;
}> = [
  { name: ["index"], typeExpr: typeExpr.typeNumber },
  { name: ["binary"], typeExpr: typeExpr.globalType("Uint8Array") }
];

/* ========================================
                  Int32
   ========================================
*/

const encodeUInt32Name = ["decodeUInt32"];
export const encodeUInt32Var = expr.localVariable(encodeUInt32Name);
const mathObject = expr.globalVariable("Math");

export const encodeUInt32Code = expr.functionWithReturnValueVariableDefinition(
  encodeUInt32Name,
  [{ name: ["num"], typeExpr: typeExpr.typeNumber }],
  readonlyArrayNumber,
  [
    expr.set(
      expr.localVariable(["num"]),
      null,
      expr.callMethod(mathObject, "floor", [
        expr.callMethod(mathObject, "max", [
          expr.numberLiteral(0),
          expr.callMethod(mathObject, "min", [
            expr.localVariable(["num"]),
            expr.numberLiteral(2 ** 32 - 1)
          ])
        ])
      ])
    ),
    expr.variableDefinition(
      ["numberArray"],
      readonlyArrayNumber,
      expr.arrayLiteral([])
    ),
    expr.whileTrue([
      expr.variableDefinition(
        ["b"],
        typeExpr.typeNumber,
        expr.bitwiseAnd(
          expr.localVariable(["num"]),
          expr.numberLiteral(0b1111111)
        )
      ),
      expr.set(
        expr.localVariable(["num"]),
        null,
        expr.unsignedRightShift(
          expr.localVariable(["num"]),
          expr.numberLiteral(7)
        )
      ),
      expr.ifStatement(
        expr.equal(expr.localVariable(["num"]), expr.numberLiteral(0)),
        [
          expr.evaluateExpr(
            expr.callMethod(expr.localVariable(["numberArray"]), "push", [
              expr.localVariable(["b"])
            ])
          ),
          expr.returnStatement(expr.localVariable(["numberArray"]))
        ]
      ),
      expr.evaluateExpr(
        expr.callMethod(expr.localVariable(["numberArray"]), "push", [
          expr.bitwiseOr(
            expr.localVariable(["b"]),
            expr.numberLiteral(0b10000000)
          )
        ])
      )
    ])
  ]
);

const decodeUInt32Name = ["decodeUInt32"];
export const decodeUInt32Var = expr.localVariable(decodeUInt32Name);

/**
 * UnsignedLeb128で表現されたバイナリをnumberの32bit符号なし整数の範囲の数値にに変換するコード
 */
export const decodeInt32Code = expr.functionWithReturnValueVariableDefinition(
  decodeUInt32Name,
  decodeParameterList,
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
          resultAndNextIndexReturnStatement(
            expr.localVariable(["result"]),
            expr.addition(
              expr.addition(
                expr.localVariable(["index"]),
                expr.localVariable(["i"])
              ),
              expr.numberLiteral(1)
            )
          )
        ]
      )
    ]),
    expr.throwError("larger than 32-bits")
  ]
);
/* ========================================
                  String
   ========================================
*/

const encodeStringName = ["encodeString"];
export const encodeStringVar = expr.localVariable(encodeStringName);

export const encodeStringCode = (isBrowser: boolean): expr.Statement =>
  expr.functionWithReturnValueVariableDefinition(
    encodeStringName,
    [{ name: ["text"], typeExpr: typeExpr.typeString }],
    readonlyArrayNumber,
    [
      expr.returnStatement(
        expr.callMethod(expr.globalVariable("Array"), "from", [
          expr.callMethod(
            expr.newExpr(
              isBrowser
                ? expr.globalVariable("TextEncoder")
                : expr.importedVariable("util", "TextEncoder"),
              []
            ),
            "encode",
            [expr.localVariable(["text"])]
          )
        ])
      )
    ]
  );

const decodeStringName = ["decodeString"];
export const decodeStringVar = expr.localVariable(decodeStringName);

/**
 * バイナリからstringに変換するコード
 * ブラウザではグローバルのTextDecoderを使い、node.jsではutilのTextDecoderを使う
 */
export const decodeStringCode = (isBrowser: boolean): expr.Statement =>
  expr.functionWithReturnValueVariableDefinition(
    decodeStringName,
    decodeParameterList,
    resultAndNextIndexType(typeExpr.typeString),
    [
      expr.variableDefinition(
        ["length"],
        resultAndNextIndexType(typeExpr.typeNumber),
        expr.call(expr.localVariable(decodeUInt32Name), [
          expr.localVariable(["index"]),
          expr.localVariable(["binary"])
        ])
      ),
      resultAndNextIndexReturnStatement(
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
        ),
        expr.addition(
          expr.addition(
            expr.localVariable(["index"]),
            expr.get(expr.localVariable(["length"]), "nextIndex")
          ),
          expr.get(expr.localVariable(["length"]), "result")
        )
      )
    ]
  );
/* ========================================
                  Boolean
   ========================================
*/

const encodeBooleanName = ["encodeBoolean"];
export const encodeBooleanVar = expr.localVariable(encodeBooleanName);

export const encodeBooleanCode = expr.functionWithReturnValueVariableDefinition(
  encodeBooleanName,
  [{ name: ["value"], typeExpr: typeExpr.typeBoolean }],
  readonlyArrayNumber,
  [
    expr.returnStatement(
      expr.arrayLiteral([
        expr.conditionalOperator(
          expr.localVariable(["value"]),
          expr.numberLiteral(1),
          expr.numberLiteral(0)
        )
      ])
    )
  ]
);

const decodeBooleanName = ["decodeBoolean"];
export const decodeBooleanVar = expr.localVariable(decodeBooleanName);

export const decodeBooleanCode = expr.functionWithReturnValueVariableDefinition(
  decodeBooleanName,
  decodeParameterList,
  resultAndNextIndexType(typeExpr.typeBoolean),
  [
    resultAndNextIndexReturnStatement(
      expr.notEqual(
        expr.getByExpr(
          expr.localVariable(["binary"]),
          expr.localVariable(["index"])
        ),
        expr.numberLiteral(0)
      ),
      expr.addition(expr.localVariable(["index"]), expr.numberLiteral(1))
    )
  ]
);
/* ========================================
                  Id
   ========================================
*/

const encodeIdName = (requestObjectName: string): ReadonlyArray<string> => [
  "encodeId",
  requestObjectName
];

const encodeIdVar = (requestObjectName: string): expr.Expr =>
  expr.localVariable(encodeIdName(requestObjectName));

export const encodeIdCode = (requestObjectName: string): expr.Statement =>
  encodeHexString(16, encodeIdName(requestObjectName));

const decodeIdName = (requestObjectName: string): ReadonlyArray<string> => [
  "decodeId",
  requestObjectName
];

const deocdeIdVar = (requestObjectName: string): expr.Expr =>
  expr.localVariable(decodeIdName(requestObjectName));

export const decodeIdCode = (requestObjectName: string): expr.Statement =>
  decodeHexString(16, decodeIdName(requestObjectName));

/* ========================================
                  Hash
   ========================================
*/

const encodeHashName = (requestObjectName: string): ReadonlyArray<string> => [
  "encodeHash",
  requestObjectName
];

const encodeHashVar = (requestObjectName: string): expr.Expr =>
  expr.localVariable(encodeHashName(requestObjectName));

export const encodeHashCode = (requestObjectName: string): expr.Statement =>
  encodeHexString(32, encodeHashName(requestObjectName));

const decodeHashName = (requestObjectName: string): ReadonlyArray<string> => [
  "decodeHash",
  requestObjectName
];

const decodeHashVar = (requestObjectName: string): expr.Expr =>
  expr.localVariable(encodeHashName(requestObjectName));

export const decodeHashCode = (requestObjectName: string): expr.Statement =>
  decodeHexString(32, decodeHashName(requestObjectName));

/* ========================================
            HexString (Id / Hash)
   ========================================
*/

const encodeHexString = (
  byteSize: number,
  functionName: ReadonlyArray<string>
): expr.Statement =>
  expr.functionWithReturnValueVariableDefinition(
    functionName,
    [{ name: ["id"], typeExpr: typeExpr.typeString }],
    readonlyArrayNumber,
    [
      expr.variableDefinition(
        ["result"],
        typeExpr.withTypeParameter(typeExpr.globalType("Array"), [
          typeExpr.typeNumber
        ]),
        expr.arrayLiteral([])
      ),
      expr.forStatement(["i"], expr.numberLiteral(byteSize), [
        expr.set(
          expr.getByExpr(
            expr.localVariable(["result"]),
            expr.localVariable(["i"])
          ),
          null,
          expr.callMethod(expr.globalVariable("Number"), "parseInt", [
            expr.callMethod(expr.localVariable(["id"]), "slice", [
              expr.multiplication(
                expr.localVariable(["i"]),
                expr.numberLiteral(2)
              ),
              expr.addition(
                expr.multiplication(
                  expr.localVariable(["i"]),
                  expr.numberLiteral(2)
                ),
                expr.numberLiteral(2)
              )
            ]),
            expr.numberLiteral(16)
          ])
        )
      ])
    ]
  );

const decodeHexString = (
  byteSize: number,
  functionName: ReadonlyArray<string>
): expr.Statement =>
  expr.functionWithReturnValueVariableDefinition(
    functionName,
    decodeParameterList,
    resultAndNextIndexType(typeExpr.typeString),
    [
      resultAndNextIndexReturnStatement(
        expr.callMethod(expr.globalVariable("Array"), "from", [
          expr.callMethod(
            expr.callMethod(
              expr.callMethod(expr.localVariable(["binary"]), "slice", [
                expr.localVariable(["index"]),
                expr.addition(
                  expr.localVariable(["index"]),
                  expr.numberLiteral(byteSize)
                )
              ]),
              "map",
              [
                expr.lambdaWithReturn(
                  [
                    {
                      name: ["n"],
                      typeExpr: typeExpr.typeNumber
                    }
                  ],
                  typeExpr.typeString,
                  [
                    expr.evaluateExpr(
                      expr.callMethod(
                        expr.callMethod(expr.localVariable(["n"]), "toString", [
                          expr.numberLiteral(16)
                        ]),
                        "padStart",
                        [expr.numberLiteral(2), expr.stringLiteral("0")]
                      )
                    )
                  ]
                )
              ]
            ),
            "join",
            [expr.stringLiteral("")]
          )
        ]),
        expr.addition(
          expr.localVariable(["index"]),
          expr.numberLiteral(byteSize)
        )
      )
    ]
  );

const memberListToObjectTypeExpr = <
  id extends type.RequestObjectId | type.ResponseObjectId
>(
  memberList: ReadonlyArray<type.Member<id>>,
  typeIdNameDictionary: ReadonlyMap<id, string>
): ReadonlyArray<readonly [
  string,
  { typeExpr: typeExpr.TypeExpr; document: string }
]> =>
  memberList.map(member => [
    member.name,
    {
      typeExpr: typeToTypeExprVar(member.type, typeIdNameDictionary),
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
  requestObjectType: type.RequestObject,
  typeIdNameDictionary: ReadonlyMap<type.RequestObjectId, string>
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
            memberListToObjectTypeExpr(pattern.memberList, typeIdNameDictionary)
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
              ].concat(
                memberListToObjectTypeExpr(
                  pattern.memberList,
                  typeIdNameDictionary
                )
              )
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

const decodeObjectCodeName = <
  T extends type.RequestObjectId | type.ResponseObjectId
>(
  requestObjectId: T
): ReadonlyArray<string> => ["objectDecode", requestObjectId.toString()];

export const decodeRequestObjectCodeVar = (
  requestObjectId: type.RequestObjectId
): expr.Expr => expr.localVariable(decodeObjectCodeName(requestObjectId));

export const decodeRequestObjectCode = (
  requestObject: type.RequestObject,
  typeIdNameDictionary: ReadonlyMap<type.RequestObjectId, string>
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
        expr.call(decodeUInt32Var, [
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
          decodePatternCode(
            expr.get(expr.localVariable(["patternIdAndIndex"]), "nextIndex"),
            expr.localVariable(["binary"]),
            pattern,
            typeIdNameDictionary
          )
        )
      ),
      expr.throwError("サポートされていなパターンです")
    ]
  );

const decodePatternCode = <
  T extends type.RequestObjectId | type.ResponseObjectId
>(
  indexExpr: expr.Expr,
  binaryExpr: expr.Expr,
  pattern: type.Pattern<T>,
  typeIdNameDictionary: ReadonlyMap<T, string>
): ReadonlyArray<expr.Statement> => {
  const memberDecodeCode = pattern.memberList.reduce<{
    decodeCode: ReadonlyArray<expr.Statement>;
    beforeIndex: expr.Expr;
  }>(
    (state, member) => ({
      decodeCode: state.decodeCode.concat([
        expr.variableDefinition(
          ["decoded", member.name],
          resultAndNextIndexType(
            typeToTypeExprVar(member.type, typeIdNameDictionary)
          ),
          expr.call(typeToDecodeVar(member.type), [
            state.beforeIndex,
            binaryExpr
          ])
        )
      ]),
      beforeIndex: expr.get(
        expr.localVariable(["decoded", member.name]),
        "nextIndex"
      )
    }),
    {
      decodeCode: [],
      beforeIndex: indexExpr
    }
  );
  const returnCode = resultAndNextIndexReturnStatement(
    memberDecodeCode.beforeIndex,
    expr.objectLiteral(
      new Map(
        pattern.memberList.map(member => [
          member.name,
          expr.get(expr.localVariable(["decoded", member.name]), "result")
        ])
      )
    )
  );
  return memberDecodeCode.decodeCode.concat([returnCode]);
};

export const typeToDecodeVar = <
  T extends type.RequestObjectId | type.ResponseObjectId
>(
  objectType: type.Type<T>
): expr.Expr => {
  switch (objectType._) {
    case type.Type_.UInt32:
      return decodeUInt32Var;
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

export const typeToTypeExprVar = <
  T extends type.RequestObjectId | type.ResponseObjectId
>(
  objectType: type.Type<T>,
  typeIdNameDictionary: ReadonlyMap<T, string>
): typeExpr.TypeExpr => {
  switch (objectType._) {
    case type.Type_.UInt32:
      return typeExpr.typeNumber;
    case type.Type_.String:
      return typeExpr.typeString;
    case type.Type_.DateTime:
      return typeExpr.globalType("Date");
    case type.Type_.List:
      return typeExpr.withTypeParameter(typeExpr.globalType("ReadonlyArray"), [
        typeToTypeExprVar(objectType.type, typeIdNameDictionary)
      ]);
    case type.Type_.Id:
      return typeExpr.typeNull; // TODO
    case type.Type_.Hash:
      return typeExpr.typeNull; // TODO
    case type.Type_.Object: {
      const objectTypeName = typeIdNameDictionary.get(objectType.objectId);
      if (objectTypeName === undefined) {
        throw Error(
          "存在しないオブジェクトのIDが指定されている id=" +
            objectType.objectId.toString()
        );
      }
      return typeExpr.globalType(objectTypeName);
    }
  }
};
