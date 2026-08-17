import {spawnSync} from "node:child_process";
import fs from "node:fs";

const checks=[];
function command(name,args=["--version"]){
 const r=spawnSync(name,args,{encoding:"utf8",shell:process.platform==="win32"});
 return {ok:r.status===0,detail:(r.stdout||r.stderr||"").trim().split("\n")[0]};
}
function add(name,ok,detail){checks.push({name,ok,detail});}

const node=command("node");
add("Node.js",node.ok,node.detail||"não encontrado");
const npm=command("npm");
add("npm",npm.ok,npm.detail||"não encontrado");
const firebase=command("firebase");
add("Firebase CLI",firebase.ok,firebase.detail||"não encontrado");

add("node_modules",fs.existsSync("node_modules"),fs.existsSync("node_modules")?"dependências instaladas":"execute npm install");
add("apps/web/.env",fs.existsSync("apps/web/.env"),fs.existsSync("apps/web/.env")?"arquivo encontrado":"copie .env.example para .env");
add(".firebaserc",fs.existsSync(".firebaserc"),fs.existsSync(".firebaserc")?"projeto selecionado":"execute firebase use --add");

console.log("\nXVendas — Diagnóstico de Deploy\n");
for(const c of checks) console.log(`${c.ok?"OK ":"ERRO"} ${c.name}: ${c.detail}`);
const failed=checks.filter(x=>!x.ok);
console.log(`\nResultado: ${checks.length-failed.length}/${checks.length} verificações básicas aprovadas.`);
if(failed.length){
 console.log("\nCorrija os itens marcados como ERRO antes do deploy.");
 process.exit(1);
}
console.log("\nAmbiente básico pronto. Execute: npm run release:check");
