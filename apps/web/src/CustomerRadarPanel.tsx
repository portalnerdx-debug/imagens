import React,{useMemo} from "react";
import {analyzeCustomer} from "./CustomerSignals";

export function CustomerRadarPanel({notes,objective,budget}:{notes:string[];objective:string;budget:string}){
 const p=useMemo(()=>analyzeCustomer(notes.join(" "),objective),[notes.join("|"),objective]);
 const next=p.label==="Focado na parcela"?"Pergunte: “Qual valor de parcela fica confortável por mês?”":
  p.label==="Focado em preço"?"Descubra primeiro o limite total e o que ele não abre mão.":
  p.label==="Focado em qualidade"?"Pergunte quais problemas ele quer evitar e por quanto tempo espera usar o produto.":
  p.label==="Perfil técnico"?"Confirme quais especificações realmente mudam o uso dele.":
  "Pergunte como o produto será usado no dia a dia.";

 return <section className="radarBox">
  <div className="radarHead"><div><span className="step">👤 Módulo 21</span><h3>Perfil + Radar de Necessidades</h3></div><strong>{p.label}</strong></div>
  <div className="signalGrid">
   {[["Preço",p.price],["Parcela",p.installment],["Qualidade",p.quality],["Técnico",p.technical],["Objetivo",p.objective]].map(([n,v]:any)=><div key={n}><span>{n}</span><div><i style={{width:`${Math.min(100,v*28)}%`}}/></div><b>{v}</b></div>)}
  </div>
  <div className="radarContent">
   <article><strong>🔍 Necessidades escondidas detectadas</strong>{p.needs.length?p.needs.map(n=><span key={n}>• {n}</span>):<span>Ainda não há sinal suficiente. Continue perguntando.</span>}</article>
   <article><strong>❓ O que pergunto agora?</strong><p>{next}</p>{budget&&<small>Orçamento informado: R$ {budget}</small>}</article>
  </div>
  {p.signals.length>0&&<small className="signals">Sinais encontrados: {p.signals.join(", ")}</small>}
 </section>
}
