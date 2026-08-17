import fs from "node:fs";
const required=[
 "VERSION","firebase.json","firestore.rules","firestore.indexes.json",
 "apps/web/src/CrediarioSimulator.tsx","apps/web/src/SecureProductLookup.tsx",
 "apps/web/src/SmartClosePanel.tsx","functions/src/clickAdapter.ts",
 "docs/ETAPA_47_PROTOCOLO_HOMOLOGACAO_REAL.md"
];
let errors=0;
for(const f of required){
 const ok=fs.existsSync(f); console.log(`${ok?"OK":"ERRO"} ${f}`); if(!ok)errors++;
}
const version=fs.readFileSync("VERSION","utf8").trim();
if(version!=="1.0.0"){console.error("ERRO versão inesperada:",version);errors++}
console.log(errors?`\nGate final: ${errors} erro(s).`:"\nGate final estrutural XVendas 1.0.0: OK");
if(errors)process.exit(1);
