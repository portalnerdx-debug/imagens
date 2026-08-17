import React,{useEffect,useState} from "react";
import {useAuth} from "./AuthContext";
import {listAtendimentos} from "./CloudStore";

type HistoryItem={
 id?:string; customerName?:string; objective?:string; budget?:number; stage?:string;
 status?:"em_atendimento"|"fechada"|"perdida"; productCode?:string; createdAt?:any;
};

function statusLabel(status?:string){
 if(status==="fechada") return "Venda fechada";
 if(status==="perdida") return "Não fechou";
 return "Em atendimento";
}

function dateLabel(value:any){
 try{
  const date=value?.toDate?.() || (value ? new Date(value) : null);
  if(!date || Number.isNaN(date.getTime())) return "Data não informada";
  return date.toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"});
 }catch{return "Data não informada";}
}

export function SalesHistoryPanel(){
 const {user,configured}=useAuth();
 const [items,setItems]=useState<HistoryItem[]>([]),[loading,setLoading]=useState(false),[error,setError]=useState("");
 async function load(){
  if(!user)return;
  try{setLoading(true);setError("");setItems((await listAtendimentos(user.uid)) as HistoryItem[])}
  catch(e:any){setError(e?.message||"Não foi possível carregar o histórico.")}
  finally{setLoading(false)}
 }
 useEffect(()=>{if(user)load()},[user?.uid]);
 if(!configured)return <section className="homeToolNotice"><strong>Histórico indisponível</strong><p>Configure o Firebase para sincronizar os atendimentos.</p></section>;
 if(!user)return <section className="homeToolNotice"><strong>Entre na sua conta</strong><p>O histórico fica vinculado ao seu usuário do XVendas.</p></section>;
 return <section className="salesHistory">
  <div className="historyHead"><div><span className="step">🕘 Histórico</span><h3>Últimos atendimentos</h3></div><button onClick={load} disabled={loading}>{loading?"Atualizando...":"Atualizar"}</button></div>
  {error&&<div className="error">{error}</div>}
  {!loading&&!error&&items.length===0&&<div className="emptyHistory"><strong>Nenhum atendimento salvo ainda.</strong><p>Quando você registrar atendimentos na nuvem, eles aparecerão aqui.</p></div>}
  <div className="historyList">{items.slice(0,12).map((item,i)=><article key={item.id||i}>
   <div className="historyMain"><strong>{item.customerName||"Cliente sem nome"}</strong><span>{item.objective||"Objetivo não informado"}</span><small>{dateLabel(item.createdAt)}</small></div>
   <div className="historyMeta"><span className={`historyStatus ${item.status||"em_atendimento"}`}>{statusLabel(item.status)}</span><small>{item.stage||"Etapa não informada"}{item.productCode?` • Produto ${item.productCode}`:""}</small></div>
  </article>)}</div>
 </section>;
}
