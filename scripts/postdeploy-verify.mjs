import fs from "node:fs";
const base=(process.argv[2]||"").replace(/\/$/,"");
if(!/^https:\/\/.+/.test(base)){
 console.error("Uso: npm run verify:production -- https://SEU_SITE.web.app");
 process.exit(1);
}
const checks=[
 {name:"Página principal",url:`${base}/`},
 {name:"SPA fallback",url:`${base}/rota-inexistente-xvendas`},
 {name:"Comparação pública",url:`${base}/#/comparar/invalido`}
];
let failed=0;
for(const c of checks){
 try{
  const r=await fetch(c.url,{redirect:"follow"});
  const text=await r.text();
  const ok=r.ok && /<html|<!doctype/i.test(text);
  console.log(`${ok?"OK":"ERRO"} ${c.name}: HTTP ${r.status}`);
  if(!ok)failed++;
 }catch(e){console.error(`ERRO ${c.name}: ${e.message}`);failed++}
}
if(fs.existsSync("firebase.json")){
 const f=JSON.parse(fs.readFileSync("firebase.json","utf8"));
 console.log(`INFO Hosting public: ${f.hosting?.public||"não configurado"}`);
 console.log(`INFO SPA rewrite: ${JSON.stringify(f.hosting?.rewrites||[])}`);
}
if(failed){console.error(`\nVerificação terminou com ${failed} falha(s).`);process.exit(1)}
console.log("\nProdução respondeu aos testes básicos.");
