import fs from "node:fs";
const files=["functions/src/clickConfig.ts","functions/src/clickAdapter.ts","functions/src/index.ts"];
let errors=0;
for(const f of files){if(!fs.existsSync(f)){console.error("FALTANDO:",f);errors++}}
const adapter=fs.readFileSync("functions/src/clickAdapter.ts","utf8");
if(/https?:\/\/plataformaclick\.com/i.test(adapter)){
 console.error("ERRO: endpoint externo foi codificado sem contrato autorizado documentado.");errors++;
}
const config=fs.readFileSync("functions/src/clickConfig.ts","utf8");
for(const k of ["defineSecret(\"CLICK_USERNAME\")","defineSecret(\"CLICK_PASSWORD\")","defineString(\"CLICK_BASE_URL\""]){
 if(!config.includes(k)){console.error("ERRO: configuração segura ausente:",k);errors++}
}
if(errors)process.exit(1);
console.log("Configuração segura do adapter Click: OK");
