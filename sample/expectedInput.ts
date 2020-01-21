type Expr = string & { _expr: never };
type Statement = string & { _statement: never };
type TypeExpr = string & { _typeExpr: never };
type ImportStatement = string & { _importNodeModule: never };
type ExposedType = string & { _exposedType: never };
type ExposedVariable = string & { _exposedVar: never };
type NodeJsCode = {
  importStatementList: Array<ImportStatement>;
  exposedTypeList: Array<ExposedType>;
  exposedVariable: Array<ExposedVariable>;
};
const importNodeModule = (path: string): ImportStatement =>
  "" as ImportStatement;
const exposedVoidFunction = (
  args: Array<{
    name: string;
    document: string;
    typeExpr: any;
  }>,
  expr: Expr | Array<Statement>
): ExposedVariable => "" as ExposedVariable;
const typeFromImportedModule = (module: any, name: string): TypeExpr =>
  "" as TypeExpr;
const get = (expr: Expr, name: string): Expr => "" as Expr;
const call = (expr: Expr, parameterLit: Array<Expr>): Expr => "" as Expr;
const arg = (depth: number, index: number): any => {};
const ifReturnVoid = (
  condition: Expr,
  thenStatement: Array<Statement>
): Statement => "" as Statement;
const ifThrow = (
  condition: Expr,
  thenStatement: Array<Statement>,
  errorMessage: string
): Statement => "" as Statement;

const localVarDefinition = (expr: Expr): Statement => "" as Statement;
const localFunctionVarDefinition = (
  parameterLit: Array<TypeExpr>,
  expr: Expr
): Statement => "" as Statement;
const localVarIndex = (depth: number, index: number): Expr => "" as Expr;

const equal = (left: Expr, right: Expr): Expr => "" as Expr;
const notEqual = (left: Expr, right: Expr): Expr => "" as Expr;
const and = (left: Expr, right: Expr): Expr => "" as Expr;
const or = (left: Expr, right: Expr): Expr => "" as Expr;
const undefinedLiteral: Expr = "" as Expr;
const stringLiteral = (value: string): Expr => "" as Expr;
const getAt = (expr: Expr, index: number): Expr => "" as Expr;
const exprToStatement = (expr: Expr): Statement => "" as Statement;
const stringType: TypeExpr = "" as TypeExpr;

const exposedTypeList: Array<TypeExpr> = [];

const input = (): NodeJsCode => {
  const expressModuleId = 0;

  const request = arg(0, 0);
  const response = arg(0, 1);
  const accept = localVarIndex(0, 0);

  const middleware = exposedVoidFunction(
    [
      {
        name: "request",
        document: "リクエスト",
        typeExpr: typeFromImportedModule(expressModuleId, "Request")
      },
      {
        name: "response",
        document: "レスポンス",
        typeExpr: typeFromImportedModule(expressModuleId, "Response")
      }
    ],
    [
      localVarDefinition(get(get(request, "headers"), "")),
      ifReturnVoid(
        and(
          notEqual(accept, undefinedLiteral),
          call(get(accept, "includes"), [stringLiteral("text/html")])
        ),
        [
          exprToStatement(
            call(get(response, "setHeader"), [
              stringLiteral("content-type"),
              stringLiteral("text/html")
            ])
          ),
          exprToStatement(call(get(response, "send"), [stringLiteral("html")]))
        ]
      ),
      localVarDefinition(get(request, "body")),
      ifThrow(
        or(stringLiteral(""), stringLiteral("")),
        [],
        "api updated.use..."
      )
    ]
      .concat(
        exposedTypeList.map(e => localFunctionVarDefinition([e], arg(0, 0)))
      )
      .concat([exprToStatement(call(get(response, "status"), []))])
  );
  return {
    importStatementList: [importNodeModule("express")],
    exposedTypeList: [],
    exposedVariable: [middleware]
  };
};
