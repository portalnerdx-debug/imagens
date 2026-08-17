const base=process.argv[2];
if(!base||!/^https?:\/\//.test(base)){
 console.error("Uso: node scripts/smoke-hosting.mjs https://SEU_SITE.web.app");
 process.exit(1);
}
const paths=["/","/#/comparar/invalido"];
let errors=0;
for(const p of paths){
 try{
  const r=await fetch(base.replace(/\/$/,"")+p,{redirect:"follow"});
  console.log(`${p} -> ${r.status}`);
  if(!r.ok)errors++;
 }catch(e){console.error(`${p} -> falhou: ${e.message}`);errors++}
}
if(errors)process.exit(1);
console.log("Smoke test do Hosting: OK");
