import React,{useMemo,useState} from "react";
import {customerReply,randomCustomer,scoreSimulation,type Difficulty,type SimCustomer} from "./CustomerSimulatorEngine";

type Msg={role:"seller"|"customer";text:string};
export function CustomerSimulatorPanel(){
 const [difficulty,setDifficulty]=useState<Difficulty>("normal");
 const [customer,setCustomer]=useState<SimCustomer|null>(null);
 const [messages,setMessages]=useState<Msg[]>([]);
 const [input,setInput]=useState("");
 const [finished,setFinished]=useState(false);
 const score=useMemo(()=>scoreSimulation(messages),[messages]);

 function start(){
  const c=randomCustomer();setCustomer(c);setMessages([{role:"customer",text:c.opening}]);setFinished(false);setInput("");
 }
 function send(){
  if(!customer||!input.trim()||finished)return;
  const seller=input.trim();const turn=messages.filter(x=>x.role==="seller").length+1;
  const reply=customerReply(customer,seller,difficulty,turn);
  setMessages(v=>[...v,{role:"seller",text:seller},{role:"customer",text:reply}]);setInput("");
 }
 return <section className="simulator">
  <div className="simHead"><div><span className="step">🤖 Módulo 27</span><h3>Simulador de Clientes</h3></div><label>Dificuldade <select value={difficulty} onChange={e=>setDifficulty(e.target.value as Difficulty)}><option value="normal">🙂 Normal</option><option value="dificil">😈 Difícil</option><option value="extremo">🔥 Extremo</option></select></label></div>
  {!customer?<div className="simStart"><strong>Treine sem depender de um cliente real.</strong><p>O sistema cria uma necessidade, orçamento, informação escondida e objeção. Você precisa descobrir e conduzir a venda.</p><button className="primary" onClick={start}>Iniciar cliente aleatório</button></div>:
  <div className="simBody">
   <div className="simScenario"><span>Cliente: <b>{customer.name}</b></span><span>Modo: <b>{difficulty}</b></span><button onClick={start}>Novo cliente</button></div>
   <div className="simChat">{messages.map((m,i)=><div key={i} className={`simMsg ${m.role}`}><small>{m.role==="seller"?"Você":"Cliente"}</small><p>{m.text}</p></div>)}</div>
   {!finished?<div className="simInput"><textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send()}}} placeholder="Digite o que você falaria para o cliente..."/><button className="primary" onClick={send}>Enviar</button><button onClick={()=>setFinished(true)} disabled={messages.length<3}>Encerrar e avaliar</button></div>:
   <div className="simResult"><div className="simScore"><strong>{score.total}</strong><span>/100</span></div><div className="simMetrics"><span>Descoberta <b>{score.discovery}</b></span><span>Escuta/perguntas <b>{score.listening}</b></span><span>Objeção <b>{score.objection}</b></span><span>Fechamento <b>{score.closing}</b></span></div><p>{score.total>=80?"Ótimo treino. Você investigou e conduziu bem a conversa.":score.total>=60?"Bom caminho. Repita o cenário tentando melhorar a menor nota.":"Repita o treino priorizando perguntas de descoberta antes de argumentar."}</p><button className="primary" onClick={start}>Treinar novamente</button></div>}
  </div>}
  <p className="simNote">O cliente simulado usa regras locais nesta etapa; ele não representa comportamento real garantido de consumidores.</p>
 </section>
}
