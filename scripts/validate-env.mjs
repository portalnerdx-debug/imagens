import fs from "node:fs";
const file="apps/web/.env";
if(!fs.existsSync(file)){
 console.error("ERRO: apps/web/.env não existe. Copie .env.example e preencha os dados do Firebase Web App.");
 process.exit(1);
}
const text=fs.readFileSync(file,"utf8");
const required=[
 "VITE_FIREBASE_API_KEY",
 "VITE_FIREBASE_AUTH_DOMAIN",
 "VITE_FIREBASE_PROJECT_ID"
];
let errors=0;
for(const key of required){
 const m=text.match(new RegExp(`^${key}=(.*)$`,"m"));
 if(!m||!m[1].trim()||/SEU_|YOUR_|CHANGE_ME/i.test(m[1])){
  console.error(`ERRO: ${key} não foi configurada.`);
  errors++;
 }
}
const forbidden=[
 /BEGIN PRIVATE KEY/i,
 /firebase-adminsdk/i,
 /FIREBASE_PRIVATE_KEY/i,
 /SERVICE_ACCOUNT_JSON/i
];
for(const rx of forbidden){
 if(rx.test(text)){console.error("ERRO: segredo de servidor encontrado no .env do frontend.");errors++}
}
if(errors)process.exit(1);
console.log("Variáveis públicas do Firebase: OK");
