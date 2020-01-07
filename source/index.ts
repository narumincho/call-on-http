import * as ts from "typescript";

// 参考: https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API

type ServerCode = {
  functions: Map<string, Function>;
  typeDefinitions: Map<string, TypeWithDocument>;
};

type Function = {
  document: Array<ts.SymbolDisplayPart>;
  arguments: Map<string, Type>;
  return: Type;
};

type TypeWithDocument = {
  document: Array<ts.SymbolDisplayPart>;
  typeBody: Type;
};

type Type =
  | {
      type: "object";
      members: Map<string, TypeWithDocument>;
    }
  | { type: "referenceInServerCode"; name: string }
  | { type: "primitive"; primitive: PrimitiveType }
  | { type: "union"; types: ReadonlyArray<Type> };

type PrimitiveType =
  | "string"
  | "number"
  | "boolean"
  | "undefined"
  | "null"
  | "never";

type ServerCodeWithTsType = {
  functionMap: FunctionMapWithTsType;
  typeHeader: TypeHeader;
};

type FunctionMapWithTsType = Map<
  string,
  {
    document: Array<ts.SymbolDisplayPart>;
    arguments: Map<string, ts.Type>;
    return: ts.Type;
  }
>;

type TypeHeader = Map<
  string,
  {
    document: Array<ts.SymbolDisplayPart>;
    declaration: ts.TypeAliasDeclaration;
  }
>;

/** Serialize a symbol into a json object */
const serializeSymbol = (
  symbol: ts.Symbol,
  typeChecker: ts.TypeChecker
): {
  name: string;
  documentation: string;
  type: string;
} => {
  return {
    name: symbol.getName(),
    documentation: ts.displayPartsToString(
      symbol.getDocumentationComment(typeChecker)
    ),
    type: typeChecker.typeToString(
      typeChecker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration)
    )
  };
};

const typeAliasDeclarationGetType = (
  typeAlias: ts.TypeAliasDeclaration
): ts.TypeNode => {
  let typeNode: null | ts.TypeNode = null;
  typeAlias.forEachChild(child => {
    if (ts.isTypeNode(child)) {
      typeNode = child;
    }
  });
  if (typeNode === null) {
    throw new Error("typeAliasDeclarationかTypeNodeを取得できなかった");
  }
  return typeNode;
};

const symbolToNameAndTsType = (typeChecker: ts.TypeChecker) => (
  symbol: ts.Symbol
): { name: string; tsType: ts.Type } => ({
  name: symbol.name,
  tsType: typeChecker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration)
});

const nodeToType = <T>(
  typeChecker: ts.TypeChecker,
  typeHeader: Map<string, T>
) => (node: ts.TypeNode): Type => {
  switch (node.kind) {
    case ts.SyntaxKind.StringKeyword:
      return {
        type: "primitive",
        primitive: "string"
      };
    case ts.SyntaxKind.NumberKeyword:
      return {
        type: "primitive",
        primitive: "number"
      };
    case ts.SyntaxKind.BooleanKeyword:
      return {
        type: "primitive",
        primitive: "boolean"
      };
    case ts.SyntaxKind.UndefinedKeyword:
      return {
        type: "primitive",
        primitive: "undefined"
      };
    case ts.SyntaxKind.NullKeyword:
      return {
        type: "primitive",
        primitive: "null"
      };
    case ts.SyntaxKind.NeverKeyword:
      return {
        type: "primitive",
        primitive: "never"
      };
  }
  if (ts.isTypeLiteralNode(node)) {
    const members: Map<
      string,
      {
        document: Array<ts.SymbolDisplayPart>;
        typeBody: Type;
      }
    > = new Map();

    for (const member of node.members) {
      if (!ts.isPropertySignature(member)) {
        throw new Error(
          "型のオブジェクトのメンバーがPropertySignatureではなかった"
        );
      }
      const memberType = member.type;
      if (memberType === undefined) {
        throw new Error("メンバーの型が不明だった");
      }
      members.set(member.name.toString(), {
        document: ((member as unknown) as {
          symbol: ts.Symbol;
        }).symbol.getDocumentationComment(typeChecker),
        typeBody: nodeToType(typeChecker, typeHeader)(memberType)
      });
    }
    return {
      type: "object",
      members: members
    };
  }
  if (ts.isTypeReferenceNode(node)) {
    const typeName = node.typeName;
    if (!ts.isIdentifier(typeName)) {
      throw new Error("名前の参照の仕方がIdentifierではなかった");
    }
    if (!typeHeader.has(typeName.text)) {
      console.log(node.getFullText());
      throw new Error(
        "型" +
          typeName.text +
          "が見つからなかった。exportで関数で参照する型はすべて直下にexportされている必要があります"
      );
    }
    return {
      type: "referenceInServerCode",
      name: typeName.text
    };
  }
  if (ts.isUnionTypeNode(node)) {
    return {
      type: "union",
      types: node.types.map(nodeToType(typeChecker, typeHeader))
    };
  }
  throw new Error("サポートされていない型の表現を受け取った");
};

const tsTypeToType = <T>(
  typeChecker: ts.TypeChecker,
  typeHeader: Map<string, T>
) => (tsType: ts.Type): Type => {
  switch (tsType.flags) {
    case ts.TypeFlags.String:
      return { type: "primitive", primitive: "string" };
    case ts.TypeFlags.Number:
      return { type: "primitive", primitive: "number" };
    case ts.TypeFlags.Boolean:
      return { type: "primitive", primitive: "boolean" };
    case ts.TypeFlags.Undefined:
      return { type: "primitive", primitive: "undefined" };
    case ts.TypeFlags.Null:
      return { type: "primitive", primitive: "null" };
    case ts.TypeFlags.Never:
      return { type: "primitive", primitive: "never" };
    case ts.TypeFlags.Object: {
      console.log(tsType.pattern?.flags);
    }
  }
  return { type: "primitive", primitive: "never" };
};

/**
 * TypeScriptコンパイラ内部で使われているIteratorをArrayに変換する
 * @param tsIterator
 */
const tsIteratorToArray = <T>(tsIterator: ts.Iterator<T>): ReadonlyArray<T> => {
  const array: Array<T> = [];
  while (true) {
    const nextResult = tsIterator.next();
    if (nextResult.done) {
      return array;
    }
    array.push(nextResult.value);
  }
};

/**
 * export されるシンボルを型定義と関数定義に分ける (宣言本体は解析しない)
 */
const symbolArrayToFunctionsAndTypesBeforeReadDeclaration = (
  symbolArray: ReadonlyArray<[ts.__String, ts.Symbol]>,
  typeChecker: ts.TypeChecker
): ServerCodeWithTsType => {
  const functions: FunctionMapWithTsType = new Map();
  const typeDefinitions: TypeHeader = new Map();
  for (const [key, symbol] of symbolArray) {
    switch (symbol.flags) {
      case ts.SymbolFlags.BlockScopedVariable: {
        const type = typeChecker.getTypeOfSymbolAtLocation(
          symbol,
          symbol.valueDeclaration
        );
        if (type.flags !== ts.TypeFlags.Object) {
          throw new Error("公開している変数の型が関数でなかった");
        }
        const callSignatures = type.getCallSignatures();
        if (callSignatures.length !== 1) {
          throw new Error("関数呼び出しの形式は1つでなければなりません");
        }
        const callSignature = callSignatures[0];
        functions.set(key.toString(), {
          document: symbol.getDocumentationComment(typeChecker),
          arguments: new Map(
            callSignature
              .getParameters()
              .map(symbolToNameAndTsType(typeChecker))
              .map(({ name, tsType }) => [name, tsType])
          ),
          return: callSignature.getReturnType()
        });
        break;
      }
      case ts.SymbolFlags.TypeAlias: {
        const declaration: ts.Declaration | undefined = symbol.declarations[0];
        if (declaration === undefined) {
          throw new Error("型定義の本体がない");
        }
        if (!ts.isTypeAliasDeclaration(declaration)) {
          throw new Error(
            "TypeAliasのdeclarationがTypeAliasDeclarationでなかった"
          );
        }
        typeDefinitions.set(key.toString(), {
          document: symbol.getDocumentationComment(typeChecker),
          declaration: declaration
        });
        break;
      }
    }
  }
  return {
    functionMap: functions,
    typeHeader: typeDefinitions
  };
};

/**
 * ファイルからサーバーのコードを解析してコード生成に必要な情報を収集する
 * @param fileName ファイル名
 * @param compilerOptions コンパイルオプション strict: trueでないといけない
 */
const serverCodeFromFile = (
  fileName: string,
  compilerOptions: ts.CompilerOptions & { strict: true }
): ServerCode => {
  const program = ts.createProgram({
    rootNames: [fileName],
    options: compilerOptions
  });
  const sourceFile = program.getSourceFile(fileName);
  if (sourceFile === undefined) {
    throw new Error("指定したファイルをソースファイルとして認識できなかった");
  }
  if (sourceFile.isDeclarationFile) {
    throw new Error("指定したファイルが型定義ファイル(.d.ts)だった");
  }
  if (!ts.isExternalModule(sourceFile)) {
    throw new Error(
      "外部へのエクスポートされる関数があるモジュールではなかった"
    );
  }
  const typeChecker = program.getTypeChecker();
  const sourceFileSymbol = typeChecker.getSymbolAtLocation(sourceFile);
  if (sourceFileSymbol === undefined) {
    throw new Error("sourceFileがSymbolとして認識されなかった");
  }
  const sourceFileExports = sourceFileSymbol.exports;
  if (sourceFileExports === undefined) {
    throw new Error("symbolTableを取得できなかった");
  }
  const functionsAndTypesBeforeReadDeclaration = symbolArrayToFunctionsAndTypesBeforeReadDeclaration(
    tsIteratorToArray(sourceFileExports.entries()),
    typeChecker
  );
  const types: Map<string, TypeWithDocument> = new Map();
  for (const [key, type] of functionsAndTypesBeforeReadDeclaration.typeHeader) {
    types.set(key, {
      document: type.document,
      typeBody: nodeToType(
        typeChecker,
        functionsAndTypesBeforeReadDeclaration.typeHeader
      )(typeAliasDeclarationGetType(type.declaration))
    });
  }
  const functionMap: Map<string, Function> = new Map();
  for (const [
    key,
    func
  ] of functionsAndTypesBeforeReadDeclaration.functionMap) {
    functionMap.set(key, {
      document: func.document,
      arguments: new Map(
        [...func.arguments].map(([name, type]) => [
          name,
          tsTypeToType(
            typeChecker,
            functionsAndTypesBeforeReadDeclaration.typeHeader
          )(type)
        ])
      ),
      return: tsTypeToType(
        typeChecker,
        functionsAndTypesBeforeReadDeclaration.typeHeader
      )(func.return)
    });
  }
  return {
    functions: functionMap,
    typeDefinitions: types
  };
};

console.log(
  serverCodeFromFile("./sample/sample.ts", {
    target: ts.ScriptTarget.ES2019,
    strict: true
  })
);
