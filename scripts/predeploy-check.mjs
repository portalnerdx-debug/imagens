import fs from "node:fs";
const required=[
 "firebase.json","firestore.rules","firestore.indexes.json",
 "apps/web/package.json","apps/web/.env.example"
];
let failed=false;
for(const f of required){
 if(!fs.existsSync(f)){console.error("FALTANDO:",f);failed=true}
}
const fb=JSON.parse(fs.readFileSync("firebase.json","utf8"));
if(fb.hosting?.public!=="apps/web/dist"){console.error("Hosting public incorreto.");failed=true}
const rules=fs.readFileSync("firestore.rules","utf8");
if(!rules.includes("request.auth.uid == uid")){console.error("Regra de isolamento por usuário não encontrada.");failed=true}
const env=fs.readFileSync("apps/web/.env.example","utf8");
for(const k of ["VITE_FIREBASE_API_KEY","VITE_FIREBASE_AUTH_DOMAIN","VITE_FIREBASE_PROJECT_ID"]){
 if(!env.includes(k)){console.error("Variável ausente no .env.example:",k);failed=true}
}
if(failed)process.exit(1);
console.log("Pré-deploy estrutural: OK");
