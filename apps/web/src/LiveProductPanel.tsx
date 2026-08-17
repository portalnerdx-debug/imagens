import React,{useEffect,useState} from "react";
import {fetchLiveProduct,type LiveProduct} from "./ProductDataService";
import {useLiveProducts} from "./LiveProductContext";
import {useAuth} from "./AuthContext";
import {cacheProduct} from "./ProductCatalogStore";
import {ClickPaymentConditions} from "./ClickPaymentConditions";

export function LiveProductPanel({defaultCode="",onLoaded}:{defaultCode?:string;onLoaded?:(p:LiveProduct)=>void}){
  const {addProduct}=useLiveProducts();
  const {user}=useAuth();
  const [code,setCode]=useState(defaultCode);
  const [data,setData]=useState<LiveProduct|null>(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");

  useEffect(()=>{if(defaultCode)setCode(defaultCode)},[defaultCode]);

  async function load(e?:React.FormEvent){
    e?.preventDefault();
    try{
      setLoading(true);setError("");
      const product=await fetchLiveProduct(code);
      setData(product);
      if(product.found){ addProduct(product); if(user) await cacheProduct(user.uid,product); }
      onLoaded?.(product);
    }catch(e:any){
      const m=String(e?.message||"");
      setError(m.includes("AUTH_REQUIRED")?"Entre na sua conta do XVendas para consultar a Plataforma Click.":m.includes("CLICK_SESSION_EXPIRED")?"A sessão da Plataforma Click expirou. Atualize a sessão do robô.":e?.message||"Falha ao consultar produto.");
    }finally{
      setLoading(false);
    }
  }

  return <section className="liveProductBox">
    <div className="liveProductHead">
      <div><span className="step">🔗 Etapa 7</span><h3>Produto ao vivo • Plataforma Click</h3></div>
      <span className="liveBadge">{data?.branch||"Filial da sessão"}</span>
    </div>

    <form className="liveSearch" onSubmit={load}>
      <input value={code} onChange={e=>setCode(e.target.value)} placeholder="Código do produto"/>
      <button className="primary" disabled={loading}>{loading?"Consultando...":"Consultar agora"}</button>
    </form>

    {error&&<div className="liveError">{error}</div>}

    {data&&<div className={data.found?"liveResult found":"liveResult"}>
      {data.imageUrl&&<img className="liveProductImage" src={data.imageUrl} alt=""/>}
      <div className="liveTop">
        <div><small>Código</small><strong>{data.code}</strong></div>
        <div><small>Produto</small><strong>{data.name||"Nome não identificado"}</strong></div>
        <div><small>Preço atual</small><strong>{data.price!==undefined?`R$ ${data.price.toFixed(2).replace(".",",")}`:"Não capturado"}</strong></div>
        <div><small>Filial</small><strong>{data.branch||"Sessão atual"}</strong></div>
      </div>
      <div className="liveMeta">
        <span>{data.voltageOptions?.length?`⚡ ${data.voltageOptions.join(" / ")}`:"⚡ Voltagem não identificada"}</span>
        <span>{data.stock!==undefined?`📦 Estoque: ${data.stock}`:"📦 Estoque ainda não identificado"}</span>
        <span>{data.captureMethod==="endpoint"?"🔗 Busca direta /busca":"🖥️ Busca visual de contingência"}</span>
      </div>
      {data.productUrl&&<a className="liveOpenLink" href={data.productUrl} target="_blank" rel="noreferrer">Abrir produto na Plataforma Click ↗</a>}
      <small className="liveSource">{data.found?"Consulta feita na sessão autenticada do backend. O XVendas não recebe a senha da Plataforma Click.":"Produto não localizado."}</small>
      {data.found&&<ClickPaymentConditions product={data}/>}
      {data.text&&<details><summary>Ver texto capturado</summary><pre>{data.text}</pre></details>}
    </div>}

    <p className="liveNote">O conector consulta primeiro o endpoint de busca observado no fluxo real da Plataforma Click e usa a interface visual apenas como contingência. Preço e filial são exibidos somente quando foram capturados na sessão atual.</p>
  </section>
}
