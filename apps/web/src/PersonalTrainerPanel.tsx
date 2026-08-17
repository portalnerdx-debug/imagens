import React,{useEffect,useMemo,useState} from "react";
import {useAuth} from "./AuthContext";
import {analyzeConversation} from "./ConversationQuality";
import {analyzeClosing} from "./ClosingSignals";
import {listLostSaleLearning,listObjectionLearning} from "./ObjectionLearningStore";
import {buildTrainingAreas,overallScore} from "./TrainingAnalytics";

export function PersonalTrainerPanel({notes,objective,budget,stage}:{notes:string[];objective:string;budget:string;stage:string}){
 const {user}=useAuth();
 const [obs,setObs]=useState<any[]>([]),[lost,setLost]=useState<any[]>([]);
 useEffect(()=>{if(!user)return;Promise.all([listObjectionLearning(user.uid),listLostSaleLearning(user.uid)]).then(([a,b])=>{setObs(a);setLost(b)}).catch(()=>{})},[user?.uid]);

 const conversation=useMemo(()=>analyzeConversation(notes,objective,budget,stage),[notes.join("|"),objective,budget,stage]);
 const closing=useMemo(()=>analyzeClosing(notes,stage,budget),[notes.join("|"),stage,budget]);
 const won=obs.filter(x=>x.outcome==="won").length;
 const areas=useMemo(()=>buildTrainingAreas({
  discovery:conversation.discovery,questions:conversation.questions,closing:closing.score,
  objectionCount:obs.length,objectionWon:won,lostCount:lost.length
 }),[conversation.discovery,conversation.questions,closing.score,obs.length,won,lost.length]);
 const total=overallScore(areas);
 const weakest=[...areas].sort((a,b)=>a.score-b.score)[0];
 const strongest=[...areas].sort((a,b)=>b.score-a.score)[0];

 const grade=total>=85?"Excelente":total>=70?"Bom":total>=55?"Em evolução":"Precisa de treino";
 return <section className="trainerPanel">
  <div className="trainerHead"><div><span className="step">🎓 Módulo 26</span><h3>Treinador Pessoal</h3></div><div className="trainerGrade"><strong>{total}</strong><span>/100 • {grade}</span></div></div>
  <div className="trainingBars">{areas.map(a=><article key={a.key}>
   <div><strong>{a.label}</strong><b>{a.score}</b></div><div className="trainingBar"><i style={{width:`${a.score}%`}}/></div><small>{a.tip}</small>
  </article>)}</div>
  <div className="coachCards">
   <article><span>🏆 Ponto mais forte</span><strong>{strongest.label}</strong><p>{strongest.score}/100. Continue repetindo o comportamento que está funcionando.</p></article>
   <article className="focusCard"><span>🎯 Foco de treinamento</span><strong>{weakest.label}</strong><p>{weakest.tip}</p></article>
  </div>
  <div className="serviceEvaluation">
   <strong>📝 Avaliação deste atendimento</strong>
   <div><span>Descoberta <b>{conversation.discovery}/100</b></span><span>Fechamento <b>{closing.score}/100</b></span><span>Qualidade geral <b>{conversation.score}/100</b></span></div>
   <p>{conversation.advice}</p>
  </div>
  <div className="dailyTraining"><strong>🏋️ Exercício recomendado agora</strong><p>{weakest.key==="discovery"?"Antes de mostrar outro produto, faça três perguntas de descoberta e registre as respostas.":weakest.key==="listening"?"No próximo cliente, tente fazer duas perguntas antes de explicar características.":weakest.key==="closing"?"Treine reconhecer uma pergunta de parcela/entrega como sinal para avançar ao fechamento.":weakest.key==="objections"?"Escolha a objeção mais comum do seu banco e pratique uma pergunta para descobrir sua causa.":"Revise a última venda perdida e escreva uma ação que você faria diferente."}</p></div>
  <p className="trainerNote">As notas são indicadores de treinamento calculados pelos registros do XVendas; não são uma avaliação oficial da empresa.</p>
 </section>
}
