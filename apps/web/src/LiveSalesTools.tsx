import React,{useMemo,useState} from "react";
import {fetchLiveProduct,type LiveProduct} from "./ProductDataService";
import {useLiveProducts} from "./LiveProductContext";

function money(n?:number){return n===undefined?"—":`R$ ${n.toFixed(2).replace(".",",")}`}

export function LiveSalesTools(){
 const {products,addProduct,clear}=useLiveProducts();
 const [code,setCode]=useState("");
 const [loading,setLoading]=useState(false);
 const [budget,setBudget]=useState("");
 const [selected,setSelected]=useState<string[]>([]);
 const [a,setA]=useState(""),[b,setB]=useState("");

 async function add(){
  if(!code.trim())return;
  try{setLoading(true);const p=await fetchLiveProduct(code);if(p.found)addProduct(p);setCode("")}finally{setLoading(false)}
 }

 const available=products.filter(p=>p.stock===undefined||p.stock>0);
 const chosen=available.filter(p=>selected.includes(p.code));
 const total=chosen.reduce((s,p)=>s+(p.price||0),0);
 const limit=Number(budget.replace(/\./g,"").replace(",",".")||0);
 const remaining=limit?limit-total:null;
 const pa=products.find(p=>p.code===a),pb=products.find(p=>p.code===b);

 const suggestions=useMemo(()=>{
  if(!available.length)return [];
  return available.filter(p=>!selected.includes(p.code)).sort((x,y)=>{
   const xs=x.stock===undefined?0:x.stock>0?1:-1,ys=y.stock===undefined?0:y.stock>0?1:-1;
   return ys-xs;
  }).slice(0,4);
 },[available,selected]);

 return <section className="liveTools">
  <div className="liveToolsHead"><div><span className="step">🔗 Módulo 17</span><h3>Ferramentas usando dados reais</h3></div><button onClick={clear}>Limpar produtos</button></div>

  <div className="quickAdd"><input value={code} onChange={e=>setCode(e.target.value)} placeholder="Adicionar outro produto pelo código"/><button className="primary" onClick={add} disabled={loading}>{loading?"Buscando...":"+ Buscar"}</button></div>

  <div className="realCatalog">
   {products.length===0?<p>Pesquise produtos acima para montar comparações e orçamentos com os dados capturados.</p>:products.map(p=><article key={p.code} className={p.stock===0?"out":""}>
    <div><strong>{p.name||`Produto ${p.code}`}</strong><small>Código {p.code}</small></div>
    <b>{money(p.price)}</b><span>{p.stock===undefined?"Estoque não capturado":p.stock>0?`${p.stock} em estoque`:"Sem estoque"}</span>
    <button disabled={p.stock===0} onClick={()=>setSelected(v=>v.includes(p.code)?v.filter(x=>x!==p.code):[...v,p.code])}>{selected.includes(p.code)?"✓ No orçamento":"+ Orçamento"}</button>
   </article>)}
  </div>

  <div className="realGrid">
   <article className="realBudget">
    <span className="step">🏠 Montador + 💰 Orçamento</span><h4>Compra com produtos reais</h4>
    <label>Limite do cliente<input value={budget} onChange={e=>setBudget(e.target.value)} placeholder="R$"/></label>
    <div className="selectedItems">{chosen.length?chosen.map(p=><div key={p.code}><span>{p.name||p.code}</span><b>{money(p.price)}</b></div>):<small>Nenhum produto selecionado.</small>}</div>
    <div className="realTotal"><span>Total</span><strong>{money(total)}</strong></div>
    {remaining!==null&&<div className={remaining>=0?"remaining ok":"remaining over"}>{remaining>=0?`Ainda cabem ${money(remaining)} no orçamento.`:`Ultrapassa o orçamento em ${money(Math.abs(remaining))}.`}</div>}
    {suggestions.length>0&&<div className="realSuggestions"><strong>🛒 Sugestões disponíveis já pesquisadas</strong>{suggestions.map(p=><button key={p.code} onClick={()=>setSelected(v=>[...v,p.code])}>{p.name||p.code} • {money(p.price)}</button>)}</div>}
   </article>

   <article className="realBattle">
    <span className="step">🥊 Batalha com dados reais</span><h4>Compare dois pesquisados</h4>
    <select value={a} onChange={e=>setA(e.target.value)}><option value="">Produto A</option>{products.map(p=><option key={p.code} value={p.code}>{p.name||p.code}</option>)}</select>
    <select value={b} onChange={e=>setB(e.target.value)}><option value="">Produto B</option>{products.map(p=><option key={p.code} value={p.code}>{p.name||p.code}</option>)}</select>
    {(pa||pb)&&<div className="battleLive">
     {[pa,pb].map((p,i)=>p?<div key={p.code}><small>{i?"B":"A"}</small><strong>{p.name||p.code}</strong><b>{money(p.price)}</b><span>{p.stock===undefined?"Estoque ?":p.stock>0?`Estoque ${p.stock}`:"Sem estoque"}</span></div>:<div key={i} className="empty">Selecione</div>)}
    </div>}
    {pa&&pb&&<p className="battleHint">{pa.stock===0&&pb.stock!==0?"O produto B tem vantagem prática porque A está sem estoque.":pb.stock===0&&pa.stock!==0?"O produto A tem vantagem prática porque B está sem estoque.":pa.price!==undefined&&pb.price!==undefined?`Diferença de preço: ${money(Math.abs(pa.price-pb.price))}. Confirme com o cliente qual benefício justifica essa diferença.`:"Compare benefícios e necessidade; preço não foi capturado para ambos."}</p>}
   </article>
  </div>
 </section>
}
