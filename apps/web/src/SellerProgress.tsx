import React,{useEffect,useMemo,useState} from "react";
import {useAuth} from "./AuthContext";
import {loadProgress,saveProgress} from "./CloudStore";

const questions=[
 {q:"Um cliente diz que o espaço da cozinha é pequeno. O que deve vir antes da recomendação?",options:["Mostrar o mais caro","Confirmar as medidas disponíveis","Oferecer garantia","Falar de todas as funções"],answer:1,explanation:"Confirmar medidas evita indicar um produto que não cabe."},
 {q:"Ao apresentar uma característica técnica, qual é a melhor sequência?",options:["Característica → benefício ligado à necessidade","Preço → desconto → característica","Marca → preço → silêncio","Todas as funções de uma vez"],answer:0,explanation:"A característica ganha valor quando é conectada ao que o cliente precisa."},
 {q:"O cliente diz que a parcela ficou alta. Qual pergunta ajuda mais?",options:["Vai levar ou não?","Quer outro produto qualquer?","Qual faixa de parcela fica confortável?","Posso falar mais das funções?"],answer:2,explanation:"O limite mensal ajuda a reconstruir a solução dentro do orçamento."},
 {q:"Quando o cliente dá um sinal forte de fechamento, o ideal é:",options:["Continuar acrescentando argumentos","Confirmar a escolha e conduzir o fechamento","Trocar de produto","Recomeçar a descoberta"],answer:1,explanation:"Argumentar demais depois de um sinal forte pode criar novas dúvidas."}
];

const missions=[
 "Em 3 atendimentos, faça pelo menos 3 perguntas antes de apresentar um produto.",
 "Tente descobrir a faixa de parcela antes de iniciar uma negociação.",
 "Em uma venda, transforme 2 características do produto em benefícios claros.",
 "Ofereça 1 produto complementar somente depois de confirmar que ele faz sentido.",
 "Após um atendimento perdido, registre o motivo real da perda."
];

export function SellerProgress(){
 const {user}=useAuth();
 const [qi,setQi]=useState(0),[chosen,setChosen]=useState<number|null>(null);
 const [correct,setCorrect]=useState(0),[answered,setAnswered]=useState(0);
 const [xp,setXp]=useState(0),[streak,setStreak]=useState(1),[missionDone,setMissionDone]=useState(false);
 const [salesGoal,setSalesGoal]=useState("10"),[sales,setSales]=useState("0");
 const [ticketGoal,setTicketGoal]=useState("1500"),[ticket,setTicket]=useState("0");
 const [extrasGoal,setExtrasGoal]=useState("5"),[extras,setExtras]=useState("0");
 const [cloudStatus,setCloudStatus]=useState("");

 const mission=missions[new Date().getDate()%missions.length];
 const today=new Date().toISOString().slice(0,10);
 const level=Math.floor(xp/100)+1,levelProgress=xp%100;

 useEffect(()=>{
  if(!user)return;
  loadProgress(user.uid).then(p=>{
   if(!p)return;
   setXp(Number(p.xp||0));setStreak(Number(p.streak||1));
   setMissionDone(Boolean(p.missionDone&&p.missionDate===today));
   setSalesGoal(String(p.goals?.sales??10));setTicketGoal(String(p.goals?.ticket??1500));setExtrasGoal(String(p.goals?.extras??5));
   setSales(String(p.current?.sales??0));setTicket(String(p.current?.ticket??0));setExtras(String(p.current?.extras??0));
  }).catch(()=>setCloudStatus("Não foi possível carregar o progresso."));
 },[user?.uid]);

 async function persist(next?:Partial<{xp:number;streak:number;missionDone:boolean}>){
  if(!user)return;
  try{
   setCloudStatus("Salvando...");
   await saveProgress(user.uid,{
    xp:next?.xp??xp,streak:next?.streak??streak,missionDone:next?.missionDone??missionDone,missionDate:today,
    goals:{sales:Number(salesGoal)||0,ticket:Number(ticketGoal)||0,extras:Number(extrasGoal)||0},
    current:{sales:Number(sales)||0,ticket:Number(ticket)||0,extras:Number(extras)||0}
   });
   setCloudStatus("Progresso salvo na nuvem.");
  }catch{setCloudStatus("Falha ao salvar progresso.");}
 }

 function answer(i:number){
  if(chosen!==null)return;
  setChosen(i);setAnswered(v=>v+1);
  if(i===questions[qi].answer){const nx=xp+20;setCorrect(v=>v+1);setXp(nx);persist({xp:nx});}
 }
 function next(){setQi(v=>(v+1)%questions.length);setChosen(null)}
 function pct(v:string,g:string){const a=Number(v)||0,b=Number(g)||0;return b?Math.min(100,Math.round(a/b*100)):0}

 const achievements=useMemo(()=>[
  {name:"Primeiro Passo",ok:answered>=1,desc:"Responda seu primeiro quiz."},
  {name:"Estudioso",ok:correct>=3,desc:"Acerte 3 perguntas."},
  {name:"Missão Cumprida",ok:missionDone,desc:"Conclua a missão do dia."},
  {name:"Nível 2",ok:level>=2,desc:"Chegue a 100 XP."}
 ],[answered,correct,missionDone,level]);

 return <section className="progressBox">
  <div className="progressHead"><div><span className="step">🏆 Módulo 11</span><h3>Evolução do Vendedor</h3></div><div className="levelBadge"><small>Nível {level}</small><strong>{xp} XP</strong></div></div>
  <div className="xpBar"><span style={{width:`${levelProgress}%`}}/></div>
  {cloudStatus&&<div className="cloudMiniStatus">{cloudStatus}</div>}

  <div className="dailyMission"><div><span>🏆 Missão do Dia</span><strong>{mission}</strong></div>
   <button className={missionDone?"done":""} onClick={()=>{if(!missionDone){const nx=xp+40,ns=streak+1;setMissionDone(true);setXp(nx);setStreak(ns);persist({xp:nx,streak:ns,missionDone:true})}}}>{missionDone?"✓ Concluída":"+ Marcar concluída"}</button>
  </div>

  <div className="progressGrid">
   <article className="quizCard"><span className="step">🧠 Memória/Quiz</span><h4>{questions[qi].q}</h4>
    <div className="quizOptions">{questions[qi].options.map((o,i)=><button key={o} disabled={chosen!==null} className={chosen===i?(i===questions[qi].answer?"correct":"wrong"):""} onClick={()=>answer(i)}>{o}</button>)}</div>
    {chosen!==null&&<div className="quizExplain"><strong>{chosen===questions[qi].answer?"✓ Correto":"Revise este ponto"}</strong><p>{questions[qi].explanation}</p><button onClick={next}>Próxima pergunta →</button></div>}
   </article>
   <article className="streakCard"><span>🔥 Sequência</span><strong>{streak} dias</strong><p>Continue treinando e registrando sua evolução.</p>
    <div className="achievementList">{achievements.map(a=><div key={a.name} className={a.ok?"unlocked":""}><b>{a.ok?"🏅":"🔒"} {a.name}</b><small>{a.desc}</small></div>)}</div>
   </article>
  </div>

  <div className="goalsBox"><div><span className="step">🎯 Metas Pessoais</span><h4>Acompanhe seu progresso</h4></div>
   <div className="goalGrid">
    <Goal title="Vendas" value={sales} setValue={setSales} goal={salesGoal} setGoal={setSalesGoal} unit="" pct={pct(sales,salesGoal)}/>
    <Goal title="Ticket médio" value={ticket} setValue={setTicket} goal={ticketGoal} setGoal={setTicketGoal} unit="R$ " pct={pct(ticket,ticketGoal)}/>
    <Goal title="Adicionais" value={extras} setValue={setExtras} goal={extrasGoal} setGoal={setExtrasGoal} unit="" pct={pct(extras,extrasGoal)}/>
   </div>
   {user&&<button className="primary saveGoals" onClick={()=>persist()}>Salvar metas na nuvem</button>}
  </div>
 </section>
}

function Goal({title,value,setValue,goal,setGoal,unit,pct}:{title:string,value:string,setValue:(x:string)=>void,goal:string,setGoal:(x:string)=>void,unit:string,pct:number}){
 return <article className="goalCard"><div><strong>{title}</strong><span>{pct}%</span></div><div className="goalBar"><span style={{width:`${pct}%`}}/></div><div className="goalInputs"><label>Atual<input value={value} onChange={e=>setValue(e.target.value)}/></label><label>Meta<input value={goal} onChange={e=>setGoal(e.target.value)}/></label></div><small>{unit}{value||0} de {unit}{goal||0}</small></article>
}
