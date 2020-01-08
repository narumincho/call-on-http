npx.ps1 tsc;
node.exe ./distribution/index.js;
npx.ps1 tsc ./use.ts;
Remove-Item ./out.ts
node.exe ./use.js;