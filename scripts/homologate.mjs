import {spawnSync} from "node:child_process";
const cmds=[
 ["node",["scripts/predeploy-check.mjs"]],
 ["node",["scripts/audit-source.mjs"]],
 ["node",["scripts/validate-env.mjs"]],
 ["npm",["run","typecheck"]],
 ["npm",["run","build"]]
];
for(const [cmd,args] of cmds){
 console.log(`\n> ${cmd} ${args.join(" ")}`);
 const r=spawnSync(cmd,args,{stdio:"inherit",shell:process.platform==="win32"});
 if(r.status!==0)process.exit(r.status??1);
}
console.log("\nHomologação local concluída. O projeto está pronto para firebase deploy.");
