import React,{useEffect,useMemo,useState} from "react";
import QRCode from "qrcode";
import {useLiveProducts} from "./LiveProductContext";
import {encodeComparison} from "./PublicComparison";

function money(n?:number){return n===undefined?"Consultar":`R$ ${n.toFixed(2).replace(".",",")}`}

export function ComparisonShare(){
 const {products}=useLiveProducts();
 const [selected,setSelected]=useState<string[]>([]);
 const [created,setCreated]=useState(false);
 const [qr,setQr]=useState("");
 const chosen=products.filter(p=>selected.includes(p.code)).slice(0,3);
 const token=useMemo(()=>chosen.length>=2?encodeComparison(chosen.map(p=>({code:p.code,name:p.name||p.code,price:p.price,stock:p.stock}))):"",[selected.join("|"),products]);
 const shareUrl=created&&token?`${location.origin}${location.pathname}#/comparar/${token}`:"";

 useEffect(()=>{
  if(!shareUrl){setQr("");return}
  QRCode.toDataURL(shareUrl,{width:320,margin:2,errorCorrectionLevel:"M"}).then(setQr).catch(()=>setQr(""));
 },[shareUrl]);

 function toggle(c:string){setCreated(false);setSelected(v=>v.includes(c)?v.filter(x=>x!==c):v.length<3?[...v,c]:v)}
 async function copy(){try{await navigator.clipboard.writeText(shareUrl)}catch{}}
 async function share(){
  if((navigator as any).share)try{await (navigator as any).share({title:"Comparação de produtos",url:shareUrl})}catch{}
  else copy();
 }

 return <section className="comparisonShare">
  <div className="shareHead"><div><span className="step">📷 Módulo 31</span><h3>QR Code de Comparação</h3></div><span>Expira em 24 horas</span></div>
  <div className="sharePicker">{products.length?products.map(p=><button key={p.code} className={selected.includes(p.code)?"picked":""} onClick={()=>toggle(p.code)}><strong>{p.name||p.code}</strong><small>{p.code} • {money(p.price)}</small></button>):<p>Pesquise produtos primeiro para montar a comparação.</p>}</div>
  {chosen.length>=2&&<div className="clientCompare">
   <div className="compareCols">{chosen.map(p=><article key={p.code}><small>{p.code}</small><strong>{p.name||p.code}</strong><b>{money(p.price)}</b><span>{p.stock===undefined?"Consultar disponibilidade":p.stock>0?"Disponível no momento da consulta":"Sem estoque no momento da consulta"}</span></article>)}</div>
   {!created?<button className="primary" onClick={()=>setCreated(true)}>📷 Gerar QR Code real</button>:
   <div className="shareResult">
    <div className="realQr">{qr?<img src={qr} alt="QR Code escaneável da comparação"/>:<span>Gerando QR...</span>}</div>
    <div><strong>Pronto para o celular do cliente</strong><p>O cliente pode escanear o QR ou receber o link. A comparação expira em 24 horas.</p><input readOnly value={shareUrl}/><div className="shareButtons"><button onClick={copy}>Copiar link</button><button className="primary" onClick={share}>Compartilhar</button></div></div>
   </div>}
  </div>}
  <p className="shareWarning"><strong>Segurança:</strong> o link contém somente os produtos escolhidos para comparação; não inclui CPF, login, dados do crediário ou dados pessoais do cliente. Preço e estoque são uma fotografia do momento e devem ser reconfirmados.</p>
 </section>
}
