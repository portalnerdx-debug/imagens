import {spawnSync} from "node:child_process";
import fs from "node:fs";
const steps=[
 ["Estrutura","node",["scripts/predeploy-check.mjs"]],
 ["Fonte","node",["scripts/audit-source.mjs"]],
 ["Firebase ENV","node",["scripts/validate-env.mjs"]],
 ["TypeScript","npm",["run","typecheck"]],
 ["Build","npm",["run","build"]]
];
let report="# XVendas — Relatório de Release\n\n";
let failed=false;
for(const [label,cmd,args] of steps){
 const r=spawnSync(cmd,args,{encoding:"utf8",shell:process.platform==="win32"});
 const ok=r.status===0;
 report+=`## ${ok?"✅":"❌"} ${label}\n\n\`\`\`\n${(r.stdout||"")+(r.stderr||"")}\n\`\`\`\n\n`;
 console.log(`${ok?"✅":"❌"} ${label}`);
 if(!ok){failed=true;break}
}
fs.mkdirSync("reports",{recursive:true});
fs.writeFileSync("reports/release-check.md",report);
console.log("\nRelatório salvo em reports/release-check.md");
if(failed)process.exit(1);
console.log("Release check aprovado.");
