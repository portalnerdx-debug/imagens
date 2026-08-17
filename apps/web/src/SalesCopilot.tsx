import React,{useMemo,useState} from "react";

type Props={notes:string[];objective:string;stage:string;budget?:string};

const objectionRules=[
 {keys:["caro","muito caro","preço alto"],title:"Preço alto",answer:"Entendo. Antes de olhar só o valor, posso confirmar o que é indispensável para você? Assim vejo se existe uma opção que entregue o que precisa sem pagar por recurso que não vai usar.",action:"Volte à necessidade principal e compare valor entregue, não apenas preço."},
 {keys:["vou pensar","pensar"],title:"Vou pensar",answer:"Claro. Para eu não insistir no que não faz sentido: o que você ainda gostaria de avaliar antes de decidir?",action:"Descubra a dúvida real antes de oferecer desconto ou outra opção."},
 {keys:["falar com","marido","esposa"],title:"Precisa consultar alguém",answer:"Sem problema. Qual informação seria mais importante levar para vocês decidirem juntos: valor, parcela, medidas ou diferenças entre os modelos?",action:"Prepare um resumo curto com os pontos necessários para a decisão."},
 {keys:["parcela alta","prestação alta"],title:"Parcela alta",answer:"Qual faixa de parcela ficaria confortável para você? Posso trabalhar a escolha a partir desse limite.",action:"Use o orçamento mensal como restrição e revise produto/condição."},
 {keys:["outra loja","pesquisar"],title:"Vai pesquisar",answer:"Faz sentido comparar. O que você vai comparar principalmente? Posso deixar bem claro onde este modelo ganha e onde outro pode fazer mais sentido.",action:"Faça comparação objetiva; não ataque concorrentes."},
 {keys:["não gostei","não quero"],title:"Rejeição do produto",answer:"Tudo bem. O que especificamente não funcionou para você nesse modelo?",action:"Identifique a causa da rejeição antes de trocar de produto."},
];

export function SalesCopilot({notes,objective,stage,budget}:Props){
 const [said,setSaid]=useState("");
 const text=[objective,...notes,said].join(" ").toLowerCase();
 const objection=useMemo(()=>objectionRules.find(r=>r.keys.some(k=>text.includes(k))),[text]);

 const closing=useMemo(()=>{
   const hot=["vou levar","quero esse","pode fazer","fecha","quanto fica em","tem estoque","quando entrega","aceita entrada"];
   const warm=["gostei","qual a diferença","quanto custa","parcela","garantia","entrega"];
   const hs=hot.filter(x=>text.includes(x)); const ws=warm.filter(x=>text.includes(x));
   const score=Math.min(95,15+hs.length*22+ws.length*9+notes.length*2);
   return {score,label:score>=65?"Momento forte":score>=38?"Em evolução":"Ainda descobrindo",signals:[...hs,...ws]};
 },[text,notes.length]);

 const nextAction=useMemo(()=>{
   if(objection) return objection.action;
   if(closing.score>=65) return "Pare de acrescentar argumentos. Confirme a escolha e faça uma pergunta de fechamento.";
   if(stage.toLowerCase().includes("abord")) return "Faça uma pergunta aberta e deixe o cliente explicar o motivo da visita.";
   if(stage.toLowerCase().includes("descob")) return budget?"Descubra a prioridade principal antes de selecionar produtos.":"Descubra também o orçamento ou faixa de parcela confortável.";
   if(stage.toLowerCase().includes("sele")) return "Apresente no máximo poucas opções e explique por que cada uma entrou na seleção.";
   if(stage.toLowerCase().includes("demon")) return "Demonstre somente recursos ligados ao que o cliente disse que valoriza.";
   if(stage.toLowerCase().includes("negoc")) return "Pergunte o que ainda impede a decisão antes de alterar preço ou condição.";
   return "Confirme a escolha e conduza o próximo passo.";
 },[objection,closing.score,stage,budget]);

 const rescue=useMemo(()=>{
   if(objection?.title==="Preço alto") return ["Não corra direto para desconto.","Reconfirme a prioridade do cliente.","Compare uma alternativa dentro do limite.","Pergunte se a nova opção resolve a necessidade."];
   if(objection?.title==="Vou pensar") return ["Não pressione.","Pergunte o que ainda precisa ser avaliado.","Responda somente à dúvida real.","Combine um próximo passo claro."];
   if(objection) return ["Reconheça a objeção sem discutir.","Faça uma pergunta para entender a causa.","Responda com informação relevante.","Teste se a objeção foi resolvida."];
   return ["Pergunte: “O que está faltando para essa opção fazer sentido?”","Escute sem interromper.","Trate apenas o impedimento citado.","Depois confirme se pode avançar."];
 },[objection]);

 return <section className="copilotBox">
   <div className="copilotHeader"><div><span className="step">🧠 Módulo 06</span><h3>Copiloto de Vendas</h3></div><div className="closingMeter"><small>Momento de fechamento</small><strong>{closing.score}% • {closing.label}</strong></div></div>

   <div className="copilotAction"><span>➡️ Próxima Melhor Ação</span><strong>{nextAction}</strong></div>

   <div className="saidBox">
     <label>💬 Cliente disse...</label>
     <div><input value={said} onChange={e=>setSaid(e.target.value)} placeholder='Ex.: "Achei caro" ou "Vou pensar"' /><button onClick={()=>setSaid("")}>Limpar</button></div>
   </div>

   {said.trim()&&<div className="responseCard">
     <span>{objection?`Objeção detectada: ${objection.title}`:"Nenhuma objeção conhecida detectada"}</span>
     <strong>{objection?.answer || "Faça uma pergunta curta para entender melhor antes de responder. Ex.: “O que mais pesa para você nessa decisão?”"}</strong>
   </div>}

   <div className="copilotGrid">
     <article><h4>🎯 Detector de Fechamento</h4>{closing.signals.length?<><p>Sinais encontrados:</p><ul>{closing.signals.map(x=><li key={x}>“{x}”</li>)}</ul></>:<p className="muted">Ainda não há sinais claros de intenção de compra. Continue descobrindo.</p>}</article>
     <article className="rescue"><h4>🚨 Salvar Venda</h4><ol>{rescue.map(x=><li key={x}>{x}</li>)}</ol></article>
   </div>
 </section>
}
