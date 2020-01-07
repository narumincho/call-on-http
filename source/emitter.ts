import * as ts from "typescript";
import * as type from "./type";
import * as tsm from "ts-morph";

export const emit = (serverCode: type.ServerCode): void => {
  const project = new tsm.Project({
    compilerOptions: {
      strict: true
    }
  });

  project.createSourceFile("out.ts", {
    statements: [
      {
        kind: tsm.StructureKind.Enum,
        name: "MyEnum",
        members: [
          {
            name: "member"
          }
        ]
      }
    ]
  });
  project.saveSync();
};
