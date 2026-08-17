import React,{useEffect,useState} from "react";
import {useAuth} from "./AuthContext";
import {listCatalog,productHistory,type CachedProduct} from "./ProductCatalogStore";
import {smartFetchProduct} from "./SmartProductService";
import {useLiveProducts} from "./LiveProductContext";

function money(v?:number){return v===undefined?"—":`R$ ${v.toFixed(2).replace(".",",")}`}

export function SmartCatalogPanel(){
 const {user}=useAuth(),{addProduct}=useLiveProducts();
 const [items,setItems]=useState<CachedProduct[]>([]),[code,setCode]=useState(""),[busy,setBusy]=useState(false);
 const [origin,setOrigin]=useState(""),[history,setHistory]=useState<any[]>([]),[histCode,setHistCode]=useState("");

 async function refresh(){if(user)setItems(await listCatalog(user.uid))}
 useEffect(()=>{refresh().catch(console.error)},[user?.uid]);

 async function search(force=false){
  if(!code.trim())return;
  try{
   setBusy(true);
   const r=await smartFetchProduct(user?.uid,code.trim(),force);
   setOrigin(r.origin==="cache"?"⚡ Resultado do cache recente":"🌐 Consultado agora na Plataforma Click");
   if(r.product.found)addProduct(r.product);
   if(user)await refresh();
  }finally{setBusy(false)}
 }
 async function showHistory(c:string){
  if(!user)return;setHistCode(c);setHistory(await productHistory(user.uid,c));
 }

 if(!user)return <section className="smartCatalog mutedCatalog"><strong>🗂️ Catálogo Inteligente</strong><span>Entre na conta para ativar cache e histórico por vendedor.</span></section>;

 return <section className="smartCatalog">
  <div className="catalogHead"><div><span className="step">🗂️ Módulo 18</span><h3>Catálogo Inteligente</h3></div><span>{items.length} produtos salvos</span></div>
  <div className="catalogSearch"><input value={code} onChange={e=>setCode(e.target.value)} placeholder="Código do produto"/><button className="primary" onClick={()=>search(false)} disabled={busy}>Pesquisar inteligente</button><button onClick={()=>search(true)} disabled={busy}>Forçar atualização</button></div>
  {origin&&<div className="catalogOrigin">{origin}</div>}
  <div className="catalogItems">{items.slice(0,12).map(p=><article key={p.code}>
   <div><strong>{p.name||`Produto ${p.code}`}</strong><small>{p.code}</small></div>
   <b>{money(p.price)}</b><span>{p.stock===undefined?"Estoque ?":p.stock>0?`${p.stock} un.`:"Sem estoque"}</span>
   <button onClick={()=>{addProduct(p);setCode(p.code)}}>Usar</button><button onClick={()=>showHistory(p.code)}>Histórico</button>
  </article>)}</div>
  {histCode&&<div className="priceHistory"><div><strong>📈 Histórico • {histCode}</strong><button onClick={()=>setHistCode("")}>Fechar</button></div>
   {history.length?history.map((h,i)=><div key={h.id||i}><span>{h.capturedAt?new Date(h.capturedAt).toLocaleString("pt-BR"):"Registro"}</span><b>{money(h.price)}</b><span>{h.stock===undefined?"Estoque ?":`Estoque ${h.stock}`}</span></div>):<p>Ainda não houve mudança registrada de preço/estoque.</p>}
  </div>}
  <p className="cacheNote">Consultas com até 30 minutos usam o cache. “Forçar atualização” consulta o site novamente e registra mudanças de preço ou estoque.</p>
 </section>
}
