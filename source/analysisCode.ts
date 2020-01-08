import * as type from "./type";
import * as tsm from "ts-morph";

// 参考: https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API

const tsmTypeToType = (
  typeDictionary: Map<string, tsm.TypeAliasDeclaration>
) => (tsmType: tsm.Type): type.Type => {
  if (tsmType.isString()) {
    return { type: "primitive", primitive: "string" };
  }
  if (tsmType.isNumber()) {
    return { type: "primitive", primitive: "number" };
  }
  if (tsmType.isBoolean()) {
    return { type: "primitive", primitive: "boolean" };
  }
  if (tsmType.isUndefined()) {
    return { type: "primitive", primitive: "undefined" };
  }
  if (tsmType.isNull()) {
    return { type: "primitive", primitive: "null" };
  }
  if (tsmType.isObject()) {
    return {
      type: "object",
      members: tsmType.getProperties().map(symbol => [
        symbol.getName(),
        {
          document: ["プロパティのドキュメント"],
          typeData: tsmTypeToType(typeDictionary)(
            symbol.getTypeAtLocation(symbol.getValueDeclarationOrThrow())
          )
        }
      ])
    };
  }
  return { type: "primitive", primitive: "null" };
};

/**
 * ファイルからサーバーのコードを解析してコード生成に必要な情報を収集する
 * @param fileName ファイル名
 * @param compilerOptions コンパイルオプション strict: trueでないといけない
 */
export const serverCodeFromFile = (
  tsConfigFilePath: string,
  compilerOptions: tsm.CompilerOptions & { strict: true }
): type.ServerCode => {
  const project = new tsm.Project({
    tsConfigFilePath: tsConfigFilePath,
    compilerOptions: compilerOptions
  });

  const typeDictionary: Map<string, tsm.TypeAliasDeclaration> = new Map();
  for (const sourceFile of project.getSourceFiles()) {
    const typeAliases = sourceFile.getTypeAliases();
    for (const typeAlias of typeAliases) {
      if (typeAlias.isExported()) {
        typeDictionary.set(
          typeAlias.getSymbolOrThrow().getFullyQualifiedName(),
          typeAlias
        );
      }
    }
  }
  const typeMap: Map<string, type.TypeData> = new Map();
  const functionMap: Map<string, type.FunctionData> = new Map();
  for (const sourceFile of project.getSourceFiles()) {
    if (sourceFile.isDeclarationFile()) {
      continue;
    }
    const functionList = sourceFile.getFunctions();
    const variableDeclarationList = sourceFile.getVariableDeclarations();

    for (const typeAliasDeclaration of typeDictionary.values()) {
      typeMap.set(typeAliasDeclaration.getName(), {
        document: typeAliasDeclaration.getJsDocs().map(d => d.getInnerText()),
        typeData: tsmTypeToType(typeDictionary)(typeAliasDeclaration.getType())
      });
    }
    for (const func of functionList) {
      if (!func.isExported()) {
        continue;
      }
      functionMap.set(func.getNameOrThrow(), {
        document: func.getJsDocs().map(d => d.getText()),
        parameters: func
          .getParameters()
          .map(parameter => [
            parameter.getName(),
            tsmTypeToType(typeDictionary)(parameter.getType())
          ]),
        return: tsmTypeToType(typeDictionary)(func.getReturnType())
      });
    }
    // for (const variableDeclaration of variableDeclarationList) {
    //   if (!variableDeclaration.isExported()) {
    //     continue;
    //   }
    //   const callSignatures = variableDeclaration.getType().getCallSignatures();
    //   if (callSignatures.length !== 1) {
    //     throw new Error("変数の型が関数でなかった");
    //   }
    //   const callSignature = callSignatures[0];
    //   console.log(variableDeclaration.getName(), callSignature);
    //   functionMap.set(variableDeclaration.getName(), {
    //     document: [callSignature.getDocumentationComments().toString()],
    //     parameters: callSignature
    //       .getParameters()
    //       .map(parameter => [
    //         parameter.getName(),
    //         tsmTypeToType(typeDictionary)(
    //           parameter.getTypeAtLocation(
    //             parameter.getValueDeclarationOrThrow()
    //           )
    //         )
    //       ]),
    //     return: tsmTypeToType(typeDictionary)(callSignature.getReturnType())
    //   });
    // }
  }
  return {
    typeDefinitions: typeMap,
    functions: functionMap
  };
};
