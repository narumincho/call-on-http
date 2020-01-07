import * as type from "./type";
import * as tsm from "ts-morph";

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
  for (const [name, typeWithDocument] of serverCode.typeDefinitions) {
    sourceFile.addTypeAlias({
      kind: tsm.StructureKind.TypeAlias,
      type: "string",
      name: name
    });
  }
  project.saveSync();
};
