const base=(process.argv[2]||"").replace(/\/$/,"");
if(!/^https:\/\//.test(base)){
 console.error("Uso: node scripts/homologation-smoke.mjs https://SUA-URL-DE-HOMOLOGACAO");
 process.exit(1);
}
const r=await fetch(base,{redirect:"follow"});
console.log(`Hosting: HTTP ${r.status}`);
if(!r.ok)process.exit(1);
const text=await r.text();
if(!/<html|<!doctype/i.test(text)){console.error("Resposta não parece HTML.");process.exit(1)}
console.log("Hosting de homologação: OK");
console.log("Agora execute manualmente o fluxo autenticado Produto → Crediário usando uma conta de teste autorizada.");
