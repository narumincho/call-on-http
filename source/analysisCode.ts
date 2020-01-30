import * as type from "./type";
import * as ts from "typescript";

// 参考: https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API

const tsTypeToServerCodeType = (
  tsType: ts.Type,
  typeChecker: ts.TypeChecker,
  typeDictionary: TypeDictionary
): type.Type => {
  if (tsType.flags === ts.TypeFlags.String) {
    return { _: type.Type_.String };
  }
  if (tsType.flags === ts.TypeFlags.Number) {
    return { _: type.Type_.Number };
  }
  if (tsType.flags === ts.TypeFlags.Boolean) {
    return { _: type.Type_.Boolean };
  }
  if (tsType.flags === ts.TypeFlags.Undefined) {
    return { _: type.Type_.Undefined };
  }
  if (tsType.flags === ts.TypeFlags.Null) {
    return { _: type.Type_.Null };
  }
  if (tsType.flags === ts.TypeFlags.Object) {
    return {
      _: type.Type_.Object,
      members: tsType.getProperties().map((symbol): [
        string,
        {
          document: string;
          type_: type.Type;
        }
      ] => [
        symbol.getName(),
        {
          document: ts.displayPartsToString(
            symbol.getDocumentationComment(typeChecker)
          ),
          type_: tsTypeToServerCodeType(
            typeChecker.getTypeOfSymbolAtLocation(
              symbol,
              symbol.valueDeclaration
            ),
            typeChecker,
            typeDictionary
          )
        }
      ])
    };
  }
  throw new Error("サポートされていない型の形式を受け取った");
};

const tsIteratorToArray = <T>(tsIterator: ts.Iterator<T>): Array<T> => {
  const array: Array<T> = [];
  while (true) {
    const result = tsIterator.next();
    if (result.done === true) {
      return array;
    }
    array.push(result.value);
  }
};

const symbolToType = (
  symbol: ts.Symbol,
  typeChecker: ts.TypeChecker
): ts.Type =>
  typeChecker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);

/**
 * ファイルからサーバーのコードを解析してコード生成に必要な情報を収集する
 * @param fileName ファイル名
 * @param compilerOptions コンパイルオプション strict: trueでないといけない
 */
export const serverCodeFromFile = (
  apiName: string,
  rootSourceFileName: string,
  compilerOptions: ts.CompilerOptions & { strict: true }
): type.ServerCode => {
  const program = ts.createProgram({
    rootNames: [rootSourceFileName],
    options: compilerOptions
  });
  const typeChecker = program.getTypeChecker();

  const typeDictionary = getTypeDictionary(program);

  const typeMap: Map<string, type.TypeData> = new Map();
  const functionMap: Map<string, type.FunctionData> = new Map();

  const rootSourceFile = program.getSourceFile(rootSourceFileName);
  if (rootSourceFile === undefined) {
    throw new Error("サーバーのコードが読み取れなかった");
  }
  const symbol = ((rootSourceFile as unknown) as {
    symbol: ts.Symbol | undefined;
  }).symbol;
  if (symbol === undefined) {
    throw new Error("サーバーのコードにexportが使われていない");
  }
  // symbolからexportされているものを取得できる
  const exportedSymbolMap = symbol.exports;
  if (exportedSymbolMap === undefined) {
    throw new Error("サーバーのコードのexportされているものを取得できなかった");
  }
  for (const [, value] of tsIteratorToArray(exportedSymbolMap.entries())) {
    if (value.flags === ts.SymbolFlags.TypeAlias) {
      const declaration = value.declarations[0];
      if (declaration === undefined) {
        throw new Error("型の定義本体を見つけることができなかった");
      }
      const declarationType = ((declaration as unknown) as {
        type: undefined | ts.TypeNode;
      }).type;
      if (declarationType === undefined) {
        console.log("declarationTypeはundefinedだった");
        continue;
      }
      typeMap.set(value.getName(), {
        document: ts.displayPartsToString(
          value.getDocumentationComment(typeChecker)
        ),
        type_: tsTypeToServerCodeType(
          typeChecker.getTypeFromTypeNode(declarationType),
          typeChecker,
          typeDictionary
        )
      });
      continue;
    }
    if (
      value.flags === ts.SymbolFlags.BlockScopedVariable ||
      value.flags === ts.SymbolFlags.Function
    ) {
      const callSignatures = symbolToType(
        value,
        typeChecker
      ).getCallSignatures();
      if (callSignatures.length !== 1) {
        throw new Error("変数の型が関数でなかった");
      }
      const callSignature = callSignatures[0];
      functionMap.set(value.getName(), {
        document: ts.displayPartsToString(
          value.getDocumentationComment(typeChecker)
        ),
        parameters: callSignature
          .getParameters()
          .map(parameter => [
            parameter.getName(),
            tsTypeToServerCodeType(
              symbolToType(parameter, typeChecker),
              typeChecker,
              typeDictionary
            )
          ]),
        return: tsTypeToServerCodeType(
          callSignature.getReturnType(),
          typeChecker,
          typeDictionary
        )
      });
    }
  }

  return {
    apiName,
    typeMap: typeMap,
    functionMap: functionMap
  };
};

type TypeDictionary = ReadonlyMap<string, ts.Symbol>;

const getTypeDictionary = (program: ts.Program): TypeDictionary => {
  const typeDictionary: Map<string, ts.Symbol> = new Map();
  for (const sourceFile of program.getSourceFiles()) {
    const symbol = ((sourceFile as unknown) as {
      symbol: ts.Symbol | undefined;
    }).symbol;
    // export が書かれているソースファイルはsymbolとして認識される
    if (symbol === undefined) {
      continue;
    }
    // symbolからexportされているものを取得できる
    const exportedSymbolMap = symbol.exports;
    if (exportedSymbolMap === undefined) {
      continue;
    }
    for (const [, value] of tsIteratorToArray(exportedSymbolMap.entries())) {
      if (value.flags === ts.SymbolFlags.TypeAlias) {
        typeDictionary.set(value.getName(), value);
      }
    }
  }
  return typeDictionary;
};
