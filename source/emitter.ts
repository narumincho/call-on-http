import * as type from "./type";
import * as tsm from "ts-morph";

const typeToString = (type: type.Type): string => {
  switch (type.type) {
    case "object": {
      return (
        "{" +
        type.members
          .map(
            ([name, typeData]) => name + ": " + typeToString(typeData.typeData)
          )
          .join(",") +
        "}"
      );
    }
    case "primitive": {
      switch (type.primitive) {
        case "string":
          return "string";
        case "number":
          return "number";
        case "boolean":
          return "boolean";
        case "undefined":
          return "undefined";
        case "null":
          return "null";
      }
    }
  }
  return "number";
};

export const emit = (
  serverCode: type.ServerCode,
  outFileName: string
): void => {
  const project = new tsm.Project({
    compilerOptions: {
      strict: true
    }
  });

  const sourceFile = project.createSourceFile(outFileName);
  console.log(serverCode);
  for (const [name, typeData] of serverCode.typeDefinitions) {
    console.log(typeData.document);
    sourceFile.addTypeAlias({
      type: typeToString(typeData.typeData),
      name: name,
      docs: typeData.document,
      isExported: true
    });
  }
  for (const [name, functionData] of serverCode.functions) {
    sourceFile.addVariableStatement({
      kind: tsm.StructureKind.VariableStatement,
      declarations: [
        {
          name: name,
          initializer: "関数の中身",
          kind: tsm.StructureKind.VariableDeclaration
        }
      ],
      isExported: true,
      docs: functionData.document
    });
  }
  project.saveSync();
};
