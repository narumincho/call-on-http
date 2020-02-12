npx.ps1 tsc --project ./sample/tsconfig.json;
node.exe ./sampleDistribution/sample/schema.js

npx.ps1 tsc sample/use.ts --strict --outDir ./sampleOut
node.exe ./sampleOut/use.js