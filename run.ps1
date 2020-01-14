Remove-Item ./sample/out.ts
npx.ps1 tsc;
node.exe ./distribution/index.js;
npx.ps1 tsc --project ./sample/tsconfig.json;
node.exe ./sampleDistribution/use.js;
