import React,{useEffect,useMemo,useState} from "react";
import {useAuth} from "./AuthContext";
import {classifyObjection,suggestedResponse} from "./ObjectionAnalyzer";
import {listLostSaleLearning,listObjectionLearning,saveLostSaleLearning,saveObjectionLearning} from "./ObjectionLearningStore";

export function ObjectionBankPanel({stage}:{stage:string}){
 const {user}=useAuth();
 const [text,setText]=useState(""),[outcome,setOutcome]=useState<"pending"|"won"|"lost">("pending");
 const [obs,setObs]=useState<any[]>([]),[lost,setLost]=useState<any[]>([]);
 const [lostReason,setLostReason]=useState("Preço"),[lostDetail,setLostDetail]=useState(""),[status,setStatus]=useState("");
 const category=useMemo(()=>classifyObjection(text),[text]);
 const response=useMemo(()=>suggestedResponse(category),[category]);

 async function load(){if(!user)return;const [a,b]=await Promise.all([listObjectionLearning(user.uid),listLostSaleLearning(user.uid)]);setObs(a);setLost(b)}
 useEffect(()=>{load().catch(()=>{})},[user?.uid]);

 async function saveObjection(){
  if(!user||!text.trim())return;
  await saveObjectionLearning(user.uid,{text:text.trim(),category,response,outcome});
  setText("");setStatus("Objeção adicionada ao banco.");await load();
 }
 async function saveLost(){
  if(!user||!lostDetail.trim())return;
  await saveLostSaleLearning(user.uid,{reason:lostReason,detail:lostDetail.trim(),stage});
  setLostDetail("");setStatus("Motivo da venda perdida registrado.");await load();
 }

 const objections=useMemo(()=>{
  const m=new Map<string,{count:number,won:number,lost:number}>();
  obs.forEach(x=>{const v=m.get(x.category)||{count:0,won:0,lost:0};v.count++;if(x.outcome==="won")v.won++;if(x.outcome==="lost")v.lost++;m.set(x.category,v)});
  return [...m.entries()].sort((a,b)=>b[1].count-a[1].count);
 },[obs]);
 const losses=useMemo(()=>{
  const m=new Map<string,number>();lost.forEach(x=>m.set(x.reason,(m.get(x.reason)||0)+1));
  return [...m.entries()].sort((a,b)=>b[1]-a[1]);
 },[lost]);

 return <section className="objectionBank">
  <div className="objectionHead"><div><span className="step">🧩 Módulo 25</span><h3>Banco de Objeções + Vendas Perdidas</h3></div><span>{obs.length} objeções • {lost.length} perdas</span></div>
  <div className="objectionGrid">
   <article><h4>💬 Registrar objeção</h4><textarea value={text} onChange={e=>setText(e.target.value)} placeholder='Ex.: "Achei caro", "vou pensar", "a parcela ficou alta"...'/>
    {text&&<div className="classified"><small>Classificação</small><strong>{category}</strong><p>{response}</p></div>}
    <label>Resultado<select value={outcome} onChange={e=>setOutcome(e.target.value as any)}><option value="pending">Ainda não sei</option><option value="won">Venda recuperada</option><option value="lost">Venda perdida</option></select></label>
    <button className="primary" onClick={saveObjection} disabled={!user||!text.trim()}>Salvar no banco</button>
   </article>
   <article><h4>📉 Analisar venda perdida</h4>
    <label>Motivo principal<select value={lostReason} onChange={e=>setLostReason(e.target.value)}>{["Preço","Condição de pagamento","Sem estoque","Prazo/entrega","Concorrência","Produto não atendeu","Decisor ausente","Cliente adiou","Outro"].map(x=><option key={x}>{x}</option>)}</select></label>
    <textarea value={lostDetail} onChange={e=>setLostDetail(e.target.value)} placeholder="O que aconteceu? Registre o ponto em que a venda travou."/>
    <button className="primary" onClick={saveLost} disabled={!user||!lostDetail.trim()}>Registrar perda</button>
    {losses[0]&&<div className="lossInsight"><strong>⚠️ Principal motivo atual: {losses[0][0]}</strong><span>{losses[0][1]} registro(s). Use isso como foco de treinamento.</span></div>}
   </article>
  </div>
  {status&&<div className="bankStatus">{status}</div>}
  <div className="learningRanking"><h4>🧠 O que seu histórico está ensinando</h4>
   {objections.length?objections.slice(0,8).map(([name,v])=><div key={name}><strong>{name}</strong><span>{v.count} encontradas</span><span>{v.won} recuperadas</span><b>{v.won+v.lost?Math.round(v.won/(v.won+v.lost)*100):0}% recuperação</b></div>):<p>Registre objeções para começar a descobrir quais aparecem mais e quais você consegue recuperar.</p>}
  </div>
  <p className="bankNote">Os percentuais refletem somente os registros feitos no sistema e ficam mais úteis conforme o histórico aumenta.</p>
 </section>
}
