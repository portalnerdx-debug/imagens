import React,{useEffect,useMemo,useState} from "react";
import {useAuth} from "./AuthContext";
import {useLiveProducts} from "./LiveProductContext";
import {learnCombos,listBaskets,saveBasket,type BasketRecord} from "./ComboLearningStore";
import {inferCategory} from "./ProductFamilies";

function money(n?:number){return n===undefined?"—":`R$ ${n.toFixed(2).replace(".",",")}`}

export function SmartCrossSell(){
 const {user}=useAuth(),{products}=useLiveProducts();
 const [selected,setSelected]=useState<string[]>([]);
 const [baskets,setBaskets]=useState<BasketRecord[]>([]);
 const [status,setStatus]=useState("");

 async function load(){if(user)setBaskets(await listBaskets(user.uid))}
 useEffect(()=>{load().catch(console.error)},[user?.uid]);

 const stats=useMemo(()=>learnCombos(baskets),[baskets]);
 const selectedSet=new Set(selected);
 const recommendations=useMemo(()=>{
  const scores=new Map<string,{score:number,count:number,confidence:number,reasons:string[]}>();
  for(const st of stats){
   if(!selectedSet.has(st.from)||selectedSet.has(st.to))continue;
   const old=scores.get(st.to)||{score:0,count:0,confidence:0,reasons:[]};
   old.score+=st.confidence*Math.log2(st.count+1);
   old.count+=st.count;old.confidence=Math.max(old.confidence,st.confidence);old.reasons.push(st.from);
   scores.set(st.to,old);
  }
  return [...scores.entries()].sort((a,b)=>b[1].score-a[1].score).slice(0,5);
 },[stats,selected.join("|")]);

 async function record(){
  if(!user||selected.length<1)return;
  const items=selected.map(code=>{
   const p=products.find(x=>x.code===code);
   return {code,name:p?.name,price:p?.price,category:inferCategory(p?.name)};
  });
  try{
   await saveBasket(user.uid,items);setStatus("Venda combinada registrada para aprendizado.");setSelected([]);await load();
  }catch(e:any){setStatus(e?.message||"Falha ao registrar.");}
 }

 if(!user)return <section className="crossSell mutedCross"><strong>🛒 Aprendizado de Combos</strong><span>Entre na conta para aprender com as vendas reais.</span></section>;

 return <section className="crossSell">
  <div className="crossHead"><div><span className="step">🛒 Módulo 19</span><h3>Combos Aprendidos pelas Vendas</h3></div><span>{baskets.length} cestas analisadas</span></div>

  <div className="crossGrid">
   <article>
    <h4>1. O que entrou nesta venda?</h4>
    <div className="basketPicker">{products.length?products.map(p=><button key={p.code} className={selected.includes(p.code)?"picked":""} onClick={()=>setSelected(v=>v.includes(p.code)?v.filter(x=>x!==p.code):[...v,p.code])}>
     <span>{p.name||p.code}</span><small>{p.code} • {money(p.price)}</small>
    </button>):<p>Pesquise os produtos da venda para registrá-los juntos.</p>}</div>
    <button className="primary recordBasket" disabled={!selected.length} onClick={record}>Registrar combinação da venda</button>
    {status&&<small className="crossStatus">{status}</small>}
   </article>

   <article className="recommendBox">
    <h4>2. Venda Cruzada Inteligente</h4>
    {!selected.length?<p>Selecione o produto principal da venda. O sistema procurará associações no histórico.</p>:recommendations.length?recommendations.map(([code,s])=>{
     const p=products.find(x=>x.code===code);
     return <div key={code}><div><strong>{p?.name||`Produto ${code}`}</strong><small>{code}</small></div><span>{s.confidence}%</span><p>Apareceu junto {s.count}x no histórico analisado.</p></div>
    }):<p>Ainda não há histórico suficiente para sugerir outro produto com base nas suas próprias vendas.</p>}
   </article>
  </div>

  <div className="comboRanking"><h4>📈 Padrões descobertos</h4>
   {stats.length?stats.slice(0,10).map(x=><div key={`${x.from}-${x.to}`}><strong>{x.from} → {x.to}</strong><span>{x.count} vendas juntas</span><b>{x.confidence}%</b></div>):<p>Os padrões aparecerão depois que vendas com mais de um produto forem registradas.</p>}
  </div>

  <p className="learningNote">As sugestões são estatísticas do seu próprio histórico, não garantias de que o cliente queira o adicional. Confirme a necessidade antes de oferecer.</p>
 </section>
}
