import React,{useState} from "react";
import {lookupClickProduct} from "./ClickGateway";
function friendly(e:any){
 const s=String(e?.message||e||"");
 if(s.includes("failed-precondition"))return "Integração autorizada com a Plataforma Click ainda não configurada.";
 if(s.includes("unauthenticated"))return "Faça login para pesquisar.";
 return "Não foi possível pesquisar o produto.";
}
export function SecureProductLookup(){
 const [code,setCode]=useState(""),[loading,setLoading]=useState(false),[error,setError]=useState(""),[data,setData]=useState<any>(null);
 const money=(n?:number)=>n===undefined?"Consultar":`R$ ${n.toFixed(2).replace(".",",")}`;
 async function search(){
  setError("");setData(null);
  if(!code.trim()){setError("Digite o código do produto.");return}
  setLoading(true);
  try{setData(await lookupClickProduct(code.trim()))}
  catch(e){setError(friendly(e))}
  finally{setLoading(false)}
 }
 return <section className="secureLookup">
  <div><span className="step">🔎 Módulo 43</span><h3>Pesquisa Rápida via Gateway Seguro</h3></div>
  <div className="secureLookupBar"><input value={code} onChange={e=>setCode(e.target.value)} onKeyDown={e=>e.key==="Enter"&&search()} placeholder="Código do produto"/><button className="primary" disabled={loading} onClick={search}>{loading?"Pesquisando...":"Pesquisar"}</button></div>
  {error&&<div className="creditError">{error}</div>}
  {data&&<div className="secureLookupResult productResult"><small>Código {data.code}</small><strong>{data.name}</strong><b>{money(data.price)}</b><span>{data.brand||"Marca não informada"}</span><span>{data.stock===undefined?"Estoque: consultar":`Estoque: ${data.stock}`}</span>{data.voltageOptions?.length>0&&<span>Voltagens: {data.voltageOptions.join(" / ")}</span>}</div>}
  <p>Esta tela consulta somente o backend do XVendas. Credenciais externas não são colocadas no navegador.</p>
 </section>
}
