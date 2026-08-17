import fs from "node:fs";
const items=[
 ["Dependências instaladas",fs.existsSync("node_modules")],
 ["Firebase ENV criado",fs.existsSync("apps/web/.env")],
 ["Projeto Firebase selecionado",fs.existsSync(".firebaserc")],
 ["Configuração Hosting",fs.existsSync("firebase.json")],
 ["Regras Firestore",fs.existsSync("firestore.rules")],
 ["Índices Firestore",fs.existsSync("firestore.indexes.json")]
];
console.log("\nXVendas — Status de Release\n");
items.forEach(([n,ok])=>console.log(`${ok?"✅":"⬜"} ${n}`));
const missing=items.filter(x=>!x[1]).length;
console.log(missing?`\n${missing} item(ns) ainda precisam ser preparados neste computador.`:"\nEstrutura local pronta para validação e deploy.");
