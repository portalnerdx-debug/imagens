import React,{useMemo} from "react";
import {analyzeConversation} from "./ConversationQuality";

const stages=["Abordagem","Descoberta","Apresentação","Negociação","Fechamento"];
function stageIndex(stage:string){
 const s=stage.toLowerCase();
 if(s.includes("fecha"))return 4;if(s.includes("negocia"))return 3;
 if(s.includes("apresent")||s.includes("produto"))return 2;
 if(s.includes("descob"))return 1;return 0;
}

export function ConversationMap({notes,objective,budget,stage}:{notes:string[];objective:string;budget:string;stage:string}){
 const q=useMemo(()=>analyzeConversation(notes,objective,budget,stage),[notes.join("|"),objective,budget,stage]);
 const idx=stageIndex(stage);
 return <section className="conversationMap">
  <div className="mapHead"><div><span className="step">🗺️ Módulo 23</span><h3>Mapa da Conversa</h3></div><strong>{q.score}/100</strong></div>
  <div className="stageTrack">{stages.map((s,i)=><div key={s} className={i<idx?"passed":i===idx?"current":""}><i>{i<idx?"✓":i+1}</i><span>{s}</span></div>)}</div>
  <div className="conversationStats">
   <article><small>Descoberta</small><strong>{q.discovery}%</strong><div><i style={{width:`${q.discovery}%`}}/></div></article>
   <article><small>Perguntas detectadas</small><strong>{q.questions}</strong><span>nas anotações</span></article>
   <article className={`talkRisk ${q.talkRisk}`}><small>Risco de falar demais</small><strong>{q.talkRisk}</strong><span>{q.talkRisk==="alto"?"Pergunte e escute agora.":q.talkRisk==="médio"?"Equilibre fala e perguntas.":"Bom equilíbrio até aqui."}</span></article>
  </div>
  <div className={q.talkRisk==="alto"?"talkAlert show":"talkAlert"}><strong>{q.talkRisk==="alto"?"⚠️ Você está falando demais":"➡️ Orientação ao vivo"}</strong><p>{q.advice}</p></div>
  <div className="discoveryChecklist"><strong>🧩 Qualidade da descoberta</strong>
   {q.missing.length?q.missing.map(x=><span key={x}>○ Falta descobrir: {x}</span>):<span>✓ Os principais pontos da descoberta foram registrados.</span>}
  </div>
  <p className="mapNote">O alerta usa as anotações registradas. Ele não mede áudio nem tempo real de fala nesta etapa.</p>
 </section>
}
