import React,{useMemo,useState} from "react";

type P={name:string;code:string;price:string;features:string;strength:string};

function score(p:P, budget:number, priority:string){
 let n=50;
 const price=Number(p.price.replace(",",".")||0);
 if(budget>0 && price>0) n += price<=budget?20:-25;
 const t=(p.features+" "+p.strength).toLowerCase();
 if(priority && t.includes(priority.toLowerCase())) n+=20;
 return Math.max(0,Math.min(100,n));
}

export function ProductBattle({budget:initialBudget}:{budget?:string}){
 const [budget,setBudget]=useState(initialBudget||"");
 const [priority,setPriority]=useState("");
 const [a,setA]=useState<P>({name:"Produto A",code:"",price:"",features:"",strength:""});
 const [b,setB]=useState<P>({name:"Produto B",code:"",price:"",features:"",strength:""});
 const max=Number(budget.replace(",",".")||0);
 const sa=useMemo(()=>score(a,max,priority),[a,max,priority]);
 const sb=useMemo(()=>score(b,max,priority),[b,max,priority]);
 const winner=sa===sb?"Empate técnico":sa>sb?a.name:b.name;

 function field(side:P,setSide:(x:P)=>void,key:keyof P,label:string,placeholder=""){
  return <label>{label}<input value={side[key]} onChange={e=>setSide({...side,[key]:e.target.value})} placeholder={placeholder}/></label>
 }

 return <section className="battleBox">
  <div className="battleHead"><div><span className="step">🥊 Módulo 08</span><h3>Batalha de Produtos</h3></div><span className="battleWinner">{winner}</span></div>
  <div className="battlePrefs">
   <label>Orçamento máximo (R$)<input value={budget} onChange={e=>setBudget(e.target.value)} placeholder="Ex.: 1800"/></label>
   <label>Prioridade do cliente<input value={priority} onChange={e=>setPriority(e.target.value)} placeholder="Ex.: capacidade, economia, praticidade"/></label>
  </div>
  <div className="battleGrid">
   {[{p:a,set:setA,s:sa},{p:b,set:setB,s:sb}].map((x,i)=><article key={i} className={x.s>=(i?sa:sb)?"battleCard leading":"battleCard"}>
    <div className="score"><b>{x.s}</b><span>aderência</span></div>
    {field(x.p,x.set,"name","Nome")}
    {field(x.p,x.set,"code","Código")}
    {field(x.p,x.set,"price","Preço (R$)")}
    <label>Características<textarea value={x.p.features} onChange={e=>x.set({...x.p,features:e.target.value})} placeholder="Ex.: 15 kg, ciclo rápido, painel digital"/></label>
    <label>Ponto forte<textarea value={x.p.strength} onChange={e=>x.set({...x.p,strength:e.target.value})} placeholder="Por que este modelo faria sentido?"/></label>
   </article>)}
  </div>
  <div className="battleAdvice"><strong>Como usar a comparação</strong><p>O placar é um apoio simples, não uma verdade absoluta. Confirme com o cliente se o critério usado realmente é o mais importante antes de recomendar.</p></div>
 </section>
}
