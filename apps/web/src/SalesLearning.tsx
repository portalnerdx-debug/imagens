import React,{useMemo,useState} from "react";
import {useAuth} from "./AuthContext";
import {saveObjection,saveLostSale} from "./CloudStore";

type Objection={text:string;response:string;worked:"sim"|"nao"|"nao_testado"};
type LostSale={reason:string;detail:string;product?:string};

const reasons=[
 "Preço","Parcela","Sem estoque","Prazo de entrega","Cliente vai pensar",
 "Vai pesquisar concorrente","Produto não agradou","Faltou confiança","Outro"
];

export function SalesLearning({notes}:{notes:string[]}){
 const {user}=useAuth();
 const [tab,setTab]=useState<"objections"|"lost"|"learning">("objections");
 const [objections,setObjections]=useState<Objection[]>([]);
 const [objText,setObjText]=useState("");
 const [objResponse,setObjResponse]=useState("");
 const [lost,setLost]=useState<LostSale[]>([]);
 const [reason,setReason]=useState("Preço");
 const [detail,setDetail]=useState("");
 const [product,setProduct]=useState("");

 const stats=useMemo(()=>{
   const tested=objections.filter(x=>x.worked!=="nao_testado");
   const wins=tested.filter(x=>x.worked==="sim").length;
   const topReason=lost.reduce((acc:Record<string,number>,x)=>(acc[x.reason]=(acc[x.reason]||0)+1,acc),{});
   const ranked=Object.entries(topReason).sort((a,b)=>b[1]-a[1]);
   return {rate:tested.length?Math.round(wins/tested.length*100):0,top:ranked[0]?.[0]||"Sem dados",lost:lost.length};
 },[objections,lost]);

 const coaching=useMemo(()=>{
   const tips:string[]=[];
   if(stats.top==="Preço") tips.push("Treine descoberta de valor antes de apresentar preço.");
   if(stats.top==="Parcela") tips.push("Descubra a faixa de parcela confortável mais cedo no atendimento.");
   if(stats.top==="Produto não agradou") tips.push("Faça mais perguntas antes de selecionar os modelos.");
   if(stats.top==="Vai pesquisar concorrente") tips.push("Treine comparação objetiva e resumo de diferenciais.");
   if(objections.length && stats.rate<50) tips.push("Revise as respostas às objeções que foram marcadas como não resolvidas.");
   if(notes.length<2) tips.push("Registre mais falas do cliente: dados melhores geram aprendizado melhor.");
   if(!tips.length) tips.push("Continue registrando atendimentos para formar seu histórico.");
   return tips;
 },[stats,objections.length,notes.length]);

 return <section className="learningBox">
  <div className="learningHead">
   <div><span className="step">🧩 Módulo 09</span><h3>Aprendizado de Vendas</h3></div>
   <div className="learningTabs">
    <button className={tab==="objections"?"active":""} onClick={()=>setTab("objections")}>Objeções</button>
    <button className={tab==="lost"?"active":""} onClick={()=>setTab("lost")}>Venda perdida</button>
    <button className={tab==="learning"?"active":""} onClick={()=>setTab("learning")}>Meu aprendizado</button>
   </div>
  </div>

  {tab==="objections"&&<div>
   <div className="learnForm">
    <label>Objeção encontrada<input value={objText} onChange={e=>setObjText(e.target.value)} placeholder='Ex.: "Está muito caro"'/></label>
    <label>Resposta que você usou<textarea value={objResponse} onChange={e=>setObjResponse(e.target.value)} placeholder="Como você respondeu?"/></label>
    <button className="primary" onClick={()=>{
     if(!objText.trim())return;
     const item={text:objText.trim(),response:objResponse.trim(),worked:"nao_testado" as const};
     setObjections(v=>[item,...v]);
     if(user) saveObjection(user.uid,item).catch(console.error);
     setObjText("");setObjResponse("");
    }}>Guardar objeção</button>
   </div>
   <div className="learnList">
    {objections.length===0?<p className="muted">Nenhuma objeção registrada nesta sessão.</p>:objections.map((o,i)=><article key={i}>
     <strong>“{o.text}”</strong><p>{o.response||"Resposta não registrada."}</p>
     <div><span>Funcionou?</span>
      <button onClick={()=>setObjections(v=>v.map((x,j)=>j===i?{...x,worked:"sim"}:x))}>✓ Sim</button>
      <button onClick={()=>setObjections(v=>v.map((x,j)=>j===i?{...x,worked:"nao"}:x))}>✕ Não</button>
     </div>
    </article>)}
   </div>
  </div>}

  {tab==="lost"&&<div>
   <div className="learnForm">
    <label>Motivo principal<select value={reason} onChange={e=>setReason(e.target.value)}>{reasons.map(x=><option key={x}>{x}</option>)}</select></label>
    <label>Produto/código<input value={product} onChange={e=>setProduct(e.target.value)} placeholder="Opcional"/></label>
    <label>O que aconteceu?<textarea value={detail} onChange={e=>setDetail(e.target.value)} placeholder="Ex.: cliente achou a parcela alta e decidiu pesquisar."/></label>
    <button className="primary" onClick={()=>{
     const item={reason,detail:detail.trim(),product:product.trim()};
     setLost(v=>[item,...v]);
     if(user) saveLostSale(user.uid,item).catch(console.error);
     setDetail("");setProduct("");
    }}>Registrar venda perdida</button>
   </div>
   <div className="lostStats"><div><small>Perdidas registradas</small><strong>{stats.lost}</strong></div><div><small>Motivo mais frequente</small><strong>{stats.top}</strong></div></div>
  </div>}

  {tab==="learning"&&<div>
   <div className="learningStats">
    <div><small>Objeções registradas</small><strong>{objections.length}</strong></div>
    <div><small>Respostas que funcionaram*</small><strong>{stats.rate}%</strong></div>
    <div><small>Principal motivo de perda</small><strong>{stats.top}</strong></div>
   </div>
   <div className="coachCard"><span>🎓 Treinador Pessoal — primeira versão</span><ul>{coaching.map(x=><li key={x}>{x}</li>)}</ul></div>
   <p className="learningNote">*Baseado apenas nos registros marcados nesta sessão. A persistência histórica será conectada ao Firebase em uma etapa posterior.</p>
  </div>}
 </section>
}
