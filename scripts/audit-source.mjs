import fs from "node:fs";
import path from "node:path";
const roots=["apps","packages"];
const exts=new Set([".ts",".tsx",".js",".jsx",".json"]);
let errors=0,warnings=0;
function walk(dir){
 if(!fs.existsSync(dir))return;
 for(const e of fs.readdirSync(dir,{withFileTypes:true})){
  const p=path.join(dir,e.name);
  if(e.isDirectory() && !["node_modules","dist",".git"].includes(e.name))walk(p);
  else if(e.isFile()&&exts.has(path.extname(e.name))){
   const t=fs.readFileSync(p,"utf8");
   if((p.endsWith(".ts")||p.endsWith(".tsx")) && t.includes('";\\nimport ')){console.error("ERRO: newline escapado em",p);errors++}
   if(/BEGIN PRIVATE KEY|firebase-adminsdk|SERVICE_ACCOUNT_JSON/i.test(t)){console.error("ERRO: possível segredo em fonte:",p);errors++}
   if(/\bCPF\b/i.test(t)&&/default|padrao|padrão/i.test(t)){console.warn("AVISO: revise CPF padrão em",p);warnings++}
  }
 }
}
roots.forEach(walk);
console.log(`Auditoria de fonte: ${errors} erro(s), ${warnings} aviso(s).`);
if(errors)process.exit(1);
