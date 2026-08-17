import React,{useEffect,useMemo,useState} from "react";
import {useAuth} from "./AuthContext";
import {useLiveProducts} from "./LiveProductContext";
import {listPerformanceSales} from "./PerformanceStore";
import {buildLearnedRecommendations} from "./LearnedRecommendationEngine";
import {analyzeCustomer} from "./CustomerSignals";
import {analyzeClosing} from "./ClosingSignals";

export function AdaptiveSalesCoach({notes,objective,budget}:{notes:string[];objective:string;budget:string}){
 const {user}=useAuth(),{products}=useLiveProducts();
 const [rows,setRows]=useState<any[]>([]);
 useEffect(()=>{if(user)listPerformanceSales(user.uid).then(setRows).catch(()=>{})},[user?.uid]);
 const profile=useMemo(()=>analyzeCustomer(notes.join(" "),objective),[notes.join("|"),objective]);
 const closing=useMemo(()=>analyzeClosing(notes,"",budget),[notes.join("|"),budget]);
 const currentCodes=useMemo(()=>products.slice(0,3).map(p=>p.code),[products]);
 const available=new Set(products.filter(p=>p.stock===undefined||p.stock>0).map(p=>p.code));
 const learned=useMemo(()=>buildLearnedRecommendations(rows,currentCodes,available),[rows,products,currentCodes.join("|")]);
 const names=new Map(products.map(p=>[p.code,p.name||p.code]));

 let next=closing.closingMoment?"Conduza para o fechamento e evite abrir novas alternativas.":profile.label==="Focado na parcela"?"Simule uma condição confortável antes de ampliar a oferta.":profile.label==="Focado em preço"?"Confirme o teto de investimento e preserve o benefício principal.":"Continue a descoberta antes de aumentar a quantidade de opções.";
 const top=learned[0];
 if(top&&top.confidence!=="baixa"&&!closing.closingMoment)next=top.productCode?`O histórico sugere ${names.get(top.productCode)||top.productCode} como complemento. Confirme primeiro se existe necessidade real.`:top.action;

 return <section className="adaptiveCoach">
  <div className="adaptiveHead"><div><span className="step">🧠 Módulo 33</span><h3>Copiloto Adaptativo</h3></div><span>{rows.length} vendas no aprendizado</span></div>
  <div className="adaptiveAction"><small>➡️ PRÓXIMA MELHOR AÇÃO</small><strong>{next}</strong></div>
  <div className="adaptiveGrid">
   <article><h4>🛒 Venda combinada aprendida</h4>{learned.filter(x=>x.productCode).length?learned.filter(x=>x.productCode).map((x,i)=><div key={i}><strong>{names.get(x.productCode!)||x.productCode}</strong><span>{x.reason}</span><b>Confiança {x.confidence}</b></div>):<p>Ainda não há combinação histórica suficiente ligada aos produtos atuais.</p>}</article>
   <article><h4>🎯 Estratégia aprendida</h4>{learned.filter(x=>!x.productCode).length?learned.filter(x=>!x.productCode).map((x,i)=><div key={i}><strong>{x.action}</strong><span>{x.reason}</span><b>Confiança {x.confidence}</b></div>):<p>Continue registrando a abordagem usada nas vendas para liberar recomendações.</p>}</article>
  </div>
  <div className="adaptiveGuard"><strong>🛡️ Regra do copiloto</strong><span>Histórico nunca vence necessidade, orçamento ou estoque. Padrões com pouca amostra recebem peso menor e não devem ser tratados como certeza.</span></div>
 </section>
}
