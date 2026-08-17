import fs from "node:fs";
import {spawnSync} from "node:child_process";

const required=[
 "apps/web/src/AuthContext.tsx",
 "apps/web/src/LiveProductContext.tsx",
 "apps/web/src/CrediarioSimulator.tsx",
 "apps/web/src/SmartClosePanel.tsx",
 "apps/web/src/SalesIntelligencePanel.tsx",
 "apps/web/src/ComparisonShare.tsx",
 "firestore.rules","firebase.json"
];
let errors=0;
console.log("\nXVendas — E2E Readiness\n");
for(const f of required){
 const ok=fs.existsSync(f);
 console.log(`${ok?"OK":"ERRO"} ${f}`);
 if(!ok)errors++;
}
const source=fs.readFileSync("apps/web/src/main.tsx","utf8");
for(const component of ["SmartClosePanel","SalesIntelligencePanel","ComparisonShare"]){
 const ok=source.includes(component);
 console.log(`${ok?"OK":"ERRO"} componente montado: ${component}`);
 if(!ok)errors++;
}
if(errors){console.error(`\n${errors} falha(s) estrutural(is).`);process.exit(1)}
console.log("\nEstrutura dos fluxos críticos encontrada.");
