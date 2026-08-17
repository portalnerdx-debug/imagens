import React,{useMemo,useState} from "react";
import {analyzeClosing} from "./ClosingSignals";

export function ClosingCoach({notes,stage,budget}:{notes:string[];stage:string;budget:string}){
 const a=useMemo(()=>analyzeClosing(notes,stage,budget),[notes.join("|"),stage,budget]);
 const [objection,setObjection]=useState("");
 const recovery=useMemo(()=>{
  const t=objection.toLowerCase();
  if(/caro|preço|preco/.test(t))return "Em vez de defender o preço, descubra a referência: “Entendi. Qual valor você imaginava investir?” Depois compare benefício e condição.";
  if(/parcela|mensal|mês|mes/.test(t))return "Pergunte qual parcela fica confortável. Depois ajuste quantidade de parcelas, entrada ou produto sem perder a necessidade principal.";
  if(/pensar|volto|depois/.test(t))return "Descubra o que ainda falta decidir: “Claro. Antes de você ir, ficou alguma dúvida sobre produto, preço ou condição?”";
  if(/esposa|marido|família|familia|falar com/.test(t))return "Facilite a decisão conjunta: resuma modelo, preço, condição e principal benefício para o cliente levar a informação correta.";
  if(/concorr|outra loja|internet/.test(t))return "Pergunte o que ele está comparando: preço final, modelo, prazo, garantia ou entrega. Compare itens equivalentes.";
  return objection.trim()?"Valide a objeção e faça uma pergunta curta para descobrir a causa real antes de oferecer desconto ou trocar o produto.":"Digite o que o cliente disse para receber uma estratégia de recuperação.";
 },[objection]);

 return <section className="closingCoach">
  <div className="closingHead">
   <div><span className="step">🎯 Módulo 22</span><h3>Momento de Fechamento</h3></div>
   <span className={`heat ${a.temperature}`}>{a.temperature==="quente"?"🔥":a.temperature==="morna"?"🌤️":"❄️"} Venda {a.temperature}</span>
  </div>
  <div className="closingScore"><div><i style={{width:`${a.score}%`}}/></div><strong>{a.score}%</strong><span>chance estimada</span></div>
  <div className={a.closingMoment?"closeAlert active":"closeAlert"}>
   <strong>{a.closingMoment?"🎯 Momento de fechamento detectado":"➡️ Próxima Melhor Ação"}</strong><p>{a.nextAction}</p>
  </div>
  <div className="closingSignals">
   <article><strong>✅ Sinais de compra</strong>{a.signals.length?a.signals.map(x=><span key={x}>• {x}</span>):<span>Nenhum sinal forte ainda.</span>}</article>
   <article><strong>⚠️ Riscos</strong>{a.risks.length?a.risks.map(x=><span key={x}>• {x}</span>):<span>Nenhuma objeção forte detectada.</span>}</article>
  </div>
  <div className="saveSale">
   <span className="step">🚨 Salvar Venda</span><h4>Cliente disse...</h4>
   <textarea value={objection} onChange={e=>setObjection(e.target.value)} placeholder='Ex.: "A parcela ficou alta", "vou pensar", "na outra loja está mais barato"...'/>
   <div className="recovery"><strong>Resposta sugerida</strong><p>{recovery}</p></div>
  </div>
  <p className="closingDisclaimer">A porcentagem é um indicador heurístico baseado nas anotações e na etapa do atendimento; não é uma previsão garantida.</p>
 </section>
}
