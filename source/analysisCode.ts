import * as type from "./type";
import * as tsm from "ts-morph";

// 参考: https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API

const tsmTypeToType = (
  typeDictionary: Map<string, tsm.TypeAliasDeclaration>
) => (tsmType: tsm.Type): type.Type => {
  if (tsmType.isString()) {
    return { type: "primitive", primitive: "string" };
  }
  return { type: "primitive", primitive: "string" };
};

/**
 * ファイルからサーバーのコードを解析してコード生成に必要な情報を収集する
 * @param fileName ファイル名
 * @param compilerOptions コンパイルオプション strict: trueでないといけない
 */
export const serverCodeFromFile = (
  tsConfigFilePath: string,
  compilerOptions: tsm.CompilerOptions & { strict: true }
): void => {
  const project = new tsm.Project({
    tsConfigFilePath: tsConfigFilePath,
    compilerOptions: compilerOptions
  });

  for (const sourceFile of project.getSourceFiles()) {
    if (sourceFile.isDeclarationFile()) {
      console.log("指定したファイルが型定義ファイル(.d.ts)だった");
    }
    const typeAliases = sourceFile.getTypeAliases();
    const functionList = sourceFile.getFunctions();
    const variableDeclarationList = sourceFile.getVariableDeclarations();

    const typeDictionary: Map<string, tsm.TypeAliasDeclaration> = new Map();
    for (const typeAlias of typeAliases) {
      if (typeAlias.isExported()) {
        typeDictionary.set(
          typeAlias.getSymbolOrThrow().getFullyQualifiedName(),
          typeAlias
        );
      }
    }
    const typeMap: Map<string, type.TypeData> = new Map();
    for (const typeAliasDeclaration of typeDictionary.values()) {
      typeMap.set(typeAliasDeclaration.getName(), {
        document: typeAliasDeclaration.getJsDocs(),
        typeBody: tsmTypeToType(typeDictionary)(typeAliasDeclaration.getType())
      });
    }
    const functionMap: Map<string, type.FunctionData> = new Map();
    for (const func of functionList) {
      if (!func.isExported()) {
        continue;
      }
      functionMap.set(func.getNameOrThrow(), {
        document: func.getJsDocs(),
        parameters: func
          .getParameters()
          .map(parameter => [
            parameter.getName(),
            tsmTypeToType(typeDictionary)(parameter.getType())
          ]),
        return: tsmTypeToType(typeDictionary)(func.getReturnType())
      });
    }
    for (const variableDeclaration of variableDeclarationList) {
      if (!variableDeclaration.isExported()) {
        continue;
      }
      variableDeclaration.getType();
    }
  }
};
