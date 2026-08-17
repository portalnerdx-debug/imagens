export type Family="cozinha"|"lavanderia"|"sala"|"quarto"|"moveis"|"outros";

const rules:{category:string;terms:string[]}[]=[
 {category:"Fogão",terms:["fogao","fogão","cooktop"]},
 {category:"Armário de Cozinha",terms:["armario","armário","cozinha","paneleiro"]},
 {category:"Mesa",terms:["mesa"]},
 {category:"Cadeiras",terms:["cadeira"]},
 {category:"Geladeira",terms:["geladeira","refrigerador"]},
 {category:"Lavadora",terms:["lavadora","maquina de lavar","máquina de lavar"]},
 {category:"TV",terms:["tv","televisor","smart"]},
 {category:"Sofá",terms:["sofa","sofá"]},
 {category:"Cama",terms:["cama","box","colchao","colchão"]},
];

export function inferCategory(name=""){
 const n=name.toLowerCase();
 return rules.find(r=>r.terms.some(t=>n.includes(t)))?.category||"Outros";
}
export function familyOf(category:string):Family{
 if(["Fogão","Armário de Cozinha","Mesa","Cadeiras","Geladeira"].includes(category))return "cozinha";
 if(category==="Lavadora")return "lavanderia";
 if(["TV","Sofá"].includes(category))return "sala";
 if(category==="Cama")return "quarto";
 return "outros";
}
export const naturalChains:Record<string,string[]>={
 "Fogão":["Armário de Cozinha","Mesa","Cadeiras"],
 "Armário de Cozinha":["Fogão","Mesa","Cadeiras"],
 "Mesa":["Cadeiras","Armário de Cozinha"],
 "Geladeira":["Armário de Cozinha","Mesa"],
 "TV":["Sofá"],
 "Sofá":["TV"],
 "Cama":[],
 "Lavadora":[]
};
