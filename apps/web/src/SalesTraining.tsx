import React,{useMemo,useState} from "react";

type Difficulty="facil"|"medio"|"dificil";
type Msg={from:"cliente"|"vendedor";text:string};

const scenarios={
 facil:{
  opening:"Boa tarde. Estou procurando uma geladeira, mas ainda não sei qual modelo.",
  objections:["Queria uma que não fosse muito cara.","Minha cozinha não é muito grande.","Gostei dessa. Quanto ficaria a parcela?"]
 },
 medio:{
  opening:"Só estou olhando. Vi alguns preços na internet antes de vir.",
  objections:["Achei esse valor alto.","Na outra loja disseram que fazem mais barato.","Eu ainda vou pensar antes de decidir."]
 },
 dificil:{
  opening:"Já vou avisando: não quero vendedor tentando me empurrar coisa. Só quero saber o preço.",
  objections:["Está caro demais.","Não vejo diferença nenhuma entre esses modelos.","Vou embora e pesquisar em outras lojas.","Não quero garantia nem adicional nenhum."]
 }
};

function evaluate(messages:Msg[]){
 const seller=messages.filter(x=>x.from==="vendedor").map(x=>x.text.toLowerCase());
 const joined=seller.join(" ");
 const questions=seller.filter(x=>x.includes("?")).length;
 const empathy=["entendo","claro","sem problema","faz sentido"].some(x=>joined.includes(x));
 const discovery=["importante","procura","precisa","orçamento","parcela","espaço","prioridade"].filter(x=>joined.includes(x)).length;
 const pressure=["tem que levar","última chance","vai perder","é o melhor e pronto"].some(x=>joined.includes(x));
 const approach=Math.min(10,5+(empathy?2:0)+(questions?2:0)-(pressure?3:0));
 const discoveryScore=Math.min(10,3+questions+discovery);
 const argument=Math.min(10,4+Math.floor(discovery/2)+(seller.length>=3?2:0));
 const closing=Math.min(10,3+(joined.includes("podemos")?2:0)+(joined.includes("seguir")?2:0)+(joined.includes("levar")?1:0));
 return {approach:Math.max(0,approach),discovery:Math.max(0,discoveryScore),argument,closing,
  total:Math.round((approach+discoveryScore+argument+closing)/4*10)/10};
}

export function SalesTraining(){
 const [difficulty,setDifficulty]=useState<Difficulty>("facil");
 const [started,setStarted]=useState(false);
 const [messages,setMessages]=useState<Msg[]>([]);
 const [input,setInput]=useState("");
 const [turn,setTurn]=useState(0);
 const [finished,setFinished]=useState(false);

 const config=scenarios[difficulty];
 const result=useMemo(()=>evaluate(messages),[messages]);

 function start(){
  setMessages([{from:"cliente",text:config.opening}]);setStarted(true);setFinished(false);setTurn(0);setInput("");
 }
 function send(){
  const text=input.trim(); if(!text)return;
  const next=[...messages,{from:"vendedor" as const,text}];
  if(turn<config.objections.length){
   next.push({from:"cliente",text:config.objections[turn]});
   setTurn(turn+1);
  } else setFinished(true);
  setMessages(next);setInput("");
 }

 return <section className="trainingBox">
  <div className="trainingHead"><div><span className="step">🤖 Módulo 10</span><h3>Simulador de Clientes</h3></div>
   <div className="difficulty">
    <button className={difficulty==="facil"?"active":""} onClick={()=>setDifficulty("facil")}>Fácil</button>
    <button className={difficulty==="medio"?"active":""} onClick={()=>setDifficulty("medio")}>Médio</button>
    <button className={difficulty==="dificil"?"active danger":""} onClick={()=>setDifficulty("dificil")}>😈 Difícil</button>
   </div>
  </div>

  {!started?<div className="trainingIntro"><h4>Treine sem cliente real</h4><p>Escolha a dificuldade. O cliente apresentará dúvidas e objeções. Responda como responderia na loja e receba uma avaliação no final.</p><button className="primary" onClick={start}>Começar treinamento</button></div>:
   <>
    <div className="trainingChat">
     {messages.map((m,i)=><div key={i} className={`trainMsg ${m.from}`}><small>{m.from==="cliente"?"Cliente":"Você"}</small><p>{m.text}</p></div>)}
    </div>
    {!finished?<div className="trainingReply"><textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="Digite como você responderia..." onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send()}}}/><button className="primary" onClick={send}>Responder</button></div>:
     <div className="evaluation">
      <div className="evaluationTitle"><div><span className="step">📝 Avaliação do Atendimento</span><h4>Nota geral: {result.total}/10</h4></div><button onClick={start}>Treinar novamente</button></div>
      <div className="scoreGrid">
       <div><span>Abordagem</span><strong>{result.approach}/10</strong></div>
       <div><span>Descoberta</span><strong>{result.discovery}/10</strong></div>
       <div><span>Argumentação</span><strong>{result.argument}/10</strong></div>
       <div><span>Fechamento</span><strong>{result.closing}/10</strong></div>
      </div>
      <div className="trainerFeedback"><strong>🎓 Treinador</strong>
       <ul>
        {result.discovery<7&&<li>Faça mais perguntas antes de recomendar ou negociar.</li>}
        {result.approach<7&&<li>Reconheça o que o cliente disse antes de apresentar sua solução.</li>}
        {result.argument<7&&<li>Ligue o argumento a uma necessidade que o cliente revelou.</li>}
        {result.closing<7&&<li>Quando houver abertura, teste o fechamento com uma pergunta simples.</li>}
        {result.total>=8&&<li>Bom equilíbrio entre perguntas e condução. Tente agora uma dificuldade maior.</li>}
       </ul>
      </div>
     </div>}
   </>
  }
 </section>
}
