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
  sourceFile.addImportDeclaration({
    moduleSpecifier: "express",
    namespaceImport: "express"
  });

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
  const middlewareFunctionDeclaration = sourceFile.addFunction({
    name: "middleware",
    returnType: "void",
    isExported: true,
    parameters: [
      { name: "request", type: "express.Request" },
      { name: "response", type: "express.Response" }
    ]
  });
  middlewareFunctionDeclaration.addVariableStatement({
    declarationKind: tsm.VariableDeclarationKind.Const,
    declarations: [{ name: "body", initializer: "request.body" }]
  });
  middlewareFunctionDeclaration.addStatements(
    `response.send(\`call on http ${JSON.stringify(
      [...serverCode.functions.entries()].map(([name, func]) => ({
        name: name,
        parameters: func.parameters,
        return: func.return
      }))
    )}\`);`
  );

  project.saveSync();
};
