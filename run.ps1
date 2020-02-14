# sample/schema.ts から サーバーのコードを生成する
npx.ps1 tsc --project ./sample/tsconfig.json;
node.exe ./sampleDistribution/sample/schema.js

# 生成されたサーバーのコードをそのまま実行する
npx.ps1 tsc sample/use.ts --strict --outDir ./sampleOut
node.exe ./sampleOut/use.js