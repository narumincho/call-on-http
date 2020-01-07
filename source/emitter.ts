import * as ts from "typescript";
import * as type from "./type";

export const emit = (serverCode: type.ServerCode): string => {
  return ts
    .createVariableDeclarationList(
      [
        ts.createVariableDeclaration(
          ts.createIdentifier("functionWithOutReturnType"),
          undefined,
          ts.createArrowFunction(
            undefined,
            undefined,
            [
              ts.createParameter(
                undefined,
                undefined,
                undefined,
                ts.createIdentifier("id"),
                undefined,
                ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
                undefined
              )
            ],
            undefined,
            ts.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
            ts.createBlock(
              [
                ts.createReturn(
                  ts.createObjectLiteral(
                    [
                      ts.createPropertyAssignment(
                        ts.createIdentifier("data"),
                        ts.createNumericLiteral("32")
                      )
                    ],
                    true
                  )
                )
              ],
              true
            )
          )
        )
      ],
      ts.NodeFlags.Const
    )
    .getText();
};
