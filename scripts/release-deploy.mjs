import {spawnSync} from "node:child_process";
function run(cmd,args){
 console.log(`\n> ${cmd} ${args.join(" ")}`);
 const r=spawnSync(cmd,args,{stdio:"inherit",shell:process.platform==="win32"});
 if(r.status!==0)process.exit(r.status??1);
}
run("npm",["run","release:check"]);
run("firebase",["deploy","--only","firestore:rules,firestore:indexes,hosting"]);
console.log("\n✅ Deploy concluído. Copie a Hosting URL exibida acima e rode:");
console.log("npm run smoke:hosting -- https://SEU_SITE.web.app");
