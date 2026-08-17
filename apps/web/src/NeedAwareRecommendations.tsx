import React,{useMemo} from "react";
import {useLiveProducts} from "./LiveProductContext";
import {analyzeCustomer} from "./CustomerSignals";
import {inferCategory} from "./ProductFamilies";

function money(n?:number){return n===undefined?"—":`R$ ${n.toFixed(2).replace(".",",")}`}

export function NeedAwareRecommendations({notes,objective,budget}:{notes:string[];objective:string;budget:string}){
 const {products}=useLiveProducts();
 const profile=useMemo(()=>analyzeCustomer(notes.join(" "),objective),[notes.join("|"),objective]);
 const limit=Number(budget.replace(/\./g,"").replace(",",".")||0);
 const ranked=useMemo(()=>products.map(p=>{
  let score=50;const reasons:string[]=[];const cat=inferCategory(p.name);
  if(p.stock===0)score-=200;
  else if(p.stock!==undefined){score+=15;reasons.push("disponível em estoque")}
  if(limit&&p.price!==undefined){if(p.price<=limit){score+=25;reasons.push("cabe no orçamento total")}else score-=60}
  if(profile.price>0&&p.price!==undefined){score+=Math.max(0,20-p.price/500);reasons.push("cliente demonstrou atenção ao preço")}
  if(profile.installment>0){score+=8;reasons.push("vale simular a parcela antes de argumentar")}
  if(profile.needs.some(x=>x.includes("cozinha"))&&["Fogão","Armário de Cozinha","Mesa","Cadeiras","Geladeira"].includes(cat)){score+=30;reasons.push("relacionado à necessidade de cozinha")}
  if(profile.needs.some(x=>x.includes("espaço"))){reasons.push("confirme medidas antes de recomendar")}
  return {p,score,reasons};
 }).filter(x=>x.p.stock!==0).sort((a,b)=>b.score-a.score).slice(0,5),[products,profile.label,profile.needs.join("|"),limit]);

 return <section className="needReco">
  <div><span className="step">🎯 Recomendação contextual</span><h3>O que faz mais sentido oferecer agora</h3></div>
  {ranked.length?ranked.map(({p,reasons},i)=><article key={p.code}>
   <span className="recoRank">#{i+1}</span><div><strong>{p.name||p.code}</strong><small>{reasons.slice(0,3).join(" • ")||"Produto pesquisado disponível"}</small></div><b>{money(p.price)}</b>
  </article>):<p>Pesquise produtos e registre o que o cliente está dizendo para gerar recomendações contextualizadas.</p>}
  <p className="needWarning">A recomendação é apoio ao vendedor. Confirme necessidade, medidas, preferência e condições antes de fechar.</p>
 </section>
}
