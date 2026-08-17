import React,{useEffect,useMemo,useState} from "react";
import {useAuth} from "./AuthContext";
import {useLiveProducts} from "./LiveProductContext";
import {awardXp,loadGameStats,type GameStats} from "./GamificationStore";
import {inferCategory} from "./ProductFamilies";

const initial:GameStats={xp:0,level:1,streak:0,lastActiveDay:"",quizzes:0,correct:0,missionsCompleted:0};

export function ProductQuizGamification(){
 const {user}=useAuth(),{products}=useLiveProducts();
 const [stats,setStats]=useState<GameStats>(initial);
 const [question,setQuestion]=useState(0),[answered,setAnswered]=useState(false),[result,setResult]=useState("");
 const [missionDone,setMissionDone]=useState(false);
 useEffect(()=>{if(user)loadGameStats(user.uid).then(setStats).catch(()=>{})},[user?.uid]);

 const quiz=useMemo(()=>{
  if(products.length<2)return null;
  const p=products[question%products.length];
  const others=products.filter(x=>x.code!==p.code).slice(0,3);
  const options=[p,...others].sort((a,b)=>a.code.localeCompare(b.code));
  return {p,options};
 },[products,question]);

 async function answer(code:string){
  if(!quiz||answered)return;
  const ok=code===quiz.p.code;setAnswered(true);setResult(ok?"✅ Correto! +20 XP":"❌ Revise esse produto. +5 XP por treinar");
  if(user){
   const next=await awardXp(user.uid,ok?20:5,{quizzes:stats.quizzes+1,correct:stats.correct+(ok?1:0)});
   setStats(next);
  }
 }
 async function next(){setQuestion(v=>v+1);setAnswered(false);setResult("")}
 async function completeMission(){
  if(missionDone)return;setMissionDone(true);
  if(user)setStats(await awardXp(user.uid,50,{missionsCompleted:stats.missionsCompleted+1}));
 }
 const mission=products.length
  ?"Durante um atendimento, descubra 3 necessidades antes de apresentar o produto."
  :"Pesquise pelo menos 2 produtos e memorize a principal diferença entre eles.";
 const progress=stats.xp%250;

 return <section className="gamePanel">
  <div className="gameHead"><div><span className="step">🔥 Módulo 28</span><h3>Treino + Gamificação</h3></div><div className="levelBadge">Nível {stats.level}</div></div>
  <div className="gameStats"><article><strong>{stats.xp}</strong><span>XP total</span></article><article><strong>🔥 {stats.streak}</strong><span>dias de sequência</span></article><article><strong>{stats.correct}/{stats.quizzes}</strong><span>acertos no quiz</span></article><article><strong>{stats.missionsCompleted}</strong><span>missões concluídas</span></article></div>
  <div className="levelProgress"><div><i style={{width:`${progress/250*100}%`}}/></div><span>{progress}/250 XP para o próximo nível</span></div>

  <div className="gameGrid">
   <article className="quizCard"><span className="step">🧠 Memória/Quiz de Produtos</span>
    {!quiz?<p>Pesquise pelo menos dois produtos para liberar perguntas usando seu catálogo atual.</p>:<>
     <h4>Qual produto corresponde ao código <b>{quiz.p.code}</b>?</h4>
     <div className="quizOptions">{quiz.options.map(p=><button key={p.code} disabled={answered} onClick={()=>answer(p.code)}>{p.name||`Produto ${p.code}`}<small>{inferCategory(p.name)}</small></button>)}</div>
     {result&&<div className="quizResult">{result}</div>}{answered&&<button className="primary" onClick={next}>Próxima pergunta</button>}
    </>}
   </article>

   <article className="missionCard"><span className="step">🏆 Missão do Dia</span><h4>{mission}</h4><p>Objetivo: transformar uma habilidade de venda em prática deliberada.</p>
    <button className={missionDone?"doneMission":"primary"} onClick={completeMission} disabled={missionDone}>{missionDone?"✓ Missão concluída":"+50 XP • Marcar como concluída"}</button>
   </article>
  </div>

  <div className="achievements"><strong>🏅 Conquistas</strong>
   <span className={stats.quizzes>=10?"unlocked":""}>🧠 Estudioso — 10 quizzes</span>
   <span className={stats.correct>=20?"unlocked":""}>🎯 Especialista — 20 acertos</span>
   <span className={stats.streak>=7?"unlocked":""}>🔥 Constância — 7 dias</span>
   <span className={stats.missionsCompleted>=10?"unlocked":""}>🏆 Executor — 10 missões</span>
  </div>
  <p className="gameNote">XP e conquistas servem para acompanhar seu treino pessoal; não representam metas ou premiações oficiais da empresa.</p>
 </section>
}
