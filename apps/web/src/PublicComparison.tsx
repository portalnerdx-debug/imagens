import React,{useEffect,useState} from "react";

export type SharedProduct={code:string;name:string;price?:number;stock?:number};
export type SharedComparison={v:1;createdAt:number;expiresAt:number;products:SharedProduct[]};

export function encodeComparison(products:SharedProduct[]){
 const payload:SharedComparison={v:1,createdAt:Date.now(),expiresAt:Date.now()+24*60*60*1000,products:products.slice(0,3)};
 return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
}
export function decodeComparison(raw:string):SharedComparison|null{
 try{
  const x=JSON.parse(decodeURIComponent(escape(atob(raw))));
  if(x?.v!==1||!Array.isArray(x.products)||x.products.length<2||x.products.length>3)return null;
  return x;
 }catch{return null}
}
const money=(n?:number)=>n===undefined?"Consultar":`R$ ${n.toFixed(2).replace(".",",")}`;

export function PublicComparison({data,onBack}:{data:SharedComparison;onBack:()=>void}){
 const expired=Date.now()>data.expiresAt;
 return <main className="publicComparison">
  <div className="publicBrand"><strong>XVendas</strong><span>Comparação de produtos</span></div>
  {expired&&<div className="expiredCompare"><strong>⚠️ Esta comparação expirou.</strong><p>Peça ao vendedor uma comparação atualizada para confirmar preço e disponibilidade.</p></div>}
  <div className="publicCompareGrid">{data.products.map(p=><article key={p.code}><small>Código {p.code}</small><h2>{p.name||p.code}</h2><strong>{money(p.price)}</strong><span>{p.stock===undefined?"Disponibilidade: consultar":p.stock>0?"Disponível quando a comparação foi criada":"Sem estoque quando a comparação foi criada"}</span></article>)}</div>
  <div className="publicNotice"><strong>Informações para comparação</strong><p>Preço, estoque e condições podem mudar. Confirme os valores e as condições atuais com o vendedor antes de finalizar a compra.</p></div>
  <button onClick={onBack}>← Voltar ao XVendas</button>
 </main>
}

export function readComparisonFromLocation(){
 const m=location.hash.match(/^#\/comparar\/(.+)$/);
 return m?decodeComparison(m[1]):null;
}
