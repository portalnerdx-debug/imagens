import fs from "node:fs";
import {spawnSync} from "node:child_process";

const rows=[];
function add(name,ok,detail){rows.push({name,ok,detail})}
function cmd(name,args){
 const r=spawnSync(name,args,{encoding:"utf8",shell:process.platform==="win32"});
 return {ok:r.status===0,detail:((r.stdout||r.stderr||"").trim().split("\n")[0]||"")};
}
add("Projeto Firebase",fs.existsSync(".firebaserc"),fs.existsSync(".firebaserc")?"selecionado":"execute firebase use --add");
add("Firebase Web ENV",fs.existsSync("apps/web/.env"),fs.existsSync("apps/web/.env")?"presente":"configure apps/web/.env");
const firebase=cmd("firebase",["--version"]);
add("Firebase CLI",firebase.ok,firebase.detail||"não encontrado");

console.log("\nXVendas — Homologation Doctor\n");
rows.forEach(r=>console.log(`${r.ok?"OK":"PENDENTE"} ${r.name}: ${r.detail}`));
console.log("\nIntegração externa necessária para homologação real:");
console.log("1. URL/documentação de API oficialmente autorizada;");
console.log("2. método de autenticação permitido;");
console.log("3. contrato dos endpoints de produto e crediário;");
console.log("4. credencial de teste cadastrada como Firebase Secret.");
const missing=rows.filter(r=>!r.ok).length;
if(missing)process.exit(1);
