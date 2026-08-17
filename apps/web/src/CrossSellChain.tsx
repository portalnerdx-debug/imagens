import React,{useMemo,useState} from "react";
import {useLiveProducts} from "./LiveProductContext";
import {inferCategory,naturalChains} from "./ProductFamilies";

function money(n?:number){return n===undefined?"—":`R$ ${n.toFixed(2).replace(".",",")}`}

export function CrossSellChain(){
 const {products}=useLiveProducts();
 const [start,setStart]=useState(""),[budget,setBudget]=useState(""),[basket,setBasket]=useState<string[]>([]);
 const limit=Number(budget.replace(/\./g,"").replace(",",".")||0);
 const current=products.find(p=>p.code===start);
 const total=basket.map(c=>products.find(p=>p.code===c)?.price||0).reduce((a,b)=>a+b,0);
 const remaining=limit?limit-total:Infinity;

 const ranked=useMemo(()=>{
  if(!current)return [];
  const baseCat=inferCategory(current.name);
  const wanted=naturalChains[baseCat]||[];
  return products.filter(p=>p.code!==current.code&&!basket.includes(p.code))
   .map(p=>{
    const category=inferCategory(p.name);
    const chainIndex=wanted.indexOf(category);
    const stockOk=p.stock===undefined||p.stock>0;
    const budgetOk=p.price===undefined||p.price<=remaining;
    const score=(chainIndex>=0?100-chainIndex*15:10)+(stockOk?20:-100)+(budgetOk?15:-50);
    return {p,category,stockOk,budgetOk,score,reason:chainIndex>=0?`${baseCat} → ${category}`:"Complemento fora da cadeia principal"};
   }).filter(x=>x.stockOk&&x.budgetOk).sort((a,b)=>b.score-a.score);
 },[current,products,basket.join("|"),remaining]);

 function begin(code:string){setStart(code);setBasket(code?[code]:[])}
 function add(code:string){setBasket(v=>v.includes(code)?v:[...v,code])}

 return <section className="chainBox">
  <div className="chainHead"><div><span className="step">🔗 Módulo 20</span><h3>Venda Cruzada em Cadeia</h3></div><span>Estoque + orçamento</span></div>
  <div className="chainControls">
   <label>Produto inicial<select value={start} onChange={e=>begin(e.target.value)}><option value="">Selecione</option>{products.map(p=><option key={p.code} value={p.code}>{p.name||p.code}</option>)}</select></label>
   <label>Orçamento máximo<input value={budget} onChange={e=>setBudget(e.target.value)} placeholder="R$"/></label>
  </div>
  {current&&<div className="chainFlow">
   <div className="chainBasket"><strong>Cesta atual</strong>{basket.map((c,i)=>{const p=products.find(x=>x.code===c);return <React.Fragment key={c}>{i>0&&<span className="arrow">→</span>}<span className="chainNode">{p?.name||c}<small>{money(p?.price)}</small></span></React.Fragment>})}</div>
   <div className="chainTotal"><span>Total: <b>{money(total)}</b></span>{limit>0&&<span>Disponível: <b>{money(Math.max(0,limit-total))}</b></span>}</div>
   <div className="nextChain"><strong>➡️ Próximas oportunidades</strong>
    {ranked.length?ranked.slice(0,5).map(({p,category,reason})=><button key={p.code} onClick={()=>add(p.code)}>
     <div><b>{p.name||p.code}</b><small>{reason}</small></div><span>{money(p.price)}</span><em>{p.stock===undefined?"estoque ?":`${p.stock} un.`}</em>
    </button>):<p>Nenhum produto pesquisado atende simultaneamente à cadeia, estoque e orçamento.</p>}
   </div>
  </div>}
  <p className="chainNote">A cadeia é uma sugestão de oportunidade. Antes de adicionar, confirme se o item resolve uma necessidade real do cliente.</p>
 </section>
}
