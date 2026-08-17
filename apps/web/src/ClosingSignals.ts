export type ClosingAnalysis={
  score:number;
  temperature:"fria"|"morna"|"quente";
  signals:string[];
  risks:string[];
  nextAction:string;
  closingMoment:boolean;
};

const positive=[
 {re:/\b(quanto fica|fica quanto|quantas vezes|em \d+x|parcela|parcelas)\b/i,label:"Perguntou condição/parcela",points:18},
 {re:/\b(tem estoque|pronta entrega|leva hoje|entrega quando|quando entrega)\b/i,label:"Perguntou disponibilidade/entrega",points:20},
 {re:/\b(vou levar|pode fazer|fecha|fechado|quero esse|esse mesmo|gostei desse)\b/i,label:"Sinal explícito de compra",points:35},
 {re:/\b(garantia|troca|instalação|instalacao)\b/i,label:"Perguntou detalhe pós-compra",points:12},
 {re:/\b(entrada|crediário|crediario|ct1|ct2)\b/i,label:"Entrou na negociação financeira",points:18},
 {re:/\b(tem 110|tem 220|voltagem)\b/i,label:"Confirmou detalhe de uso",points:10}
];

const negative=[
 {re:/\b(só olhando|so olhando|vou pensar|depois eu volto|pesquisar mais)\b/i,label:"Ainda sem compromisso",points:-18},
 {re:/\b(caro|muito alto|não cabe|nao cabe|parcela alta)\b/i,label:"Objeção de preço/parcela",points:-15},
 {re:/\b(não gostei|nao gostei|não serve|nao serve)\b/i,label:"Produto não encaixou",points:-22},
 {re:/\b(sem estoque|não tem estoque|nao tem estoque)\b/i,label:"Risco de disponibilidade",points:-25}
];

export function analyzeClosing(notes:string[],stage:string,budget?:string):ClosingAnalysis{
 const text=notes.join(" ");
 let score=18,signals:string[]=[],risks:string[]=[];
 for(const x of positive)if(x.re.test(text)){score+=x.points;signals.push(x.label)}
 for(const x of negative)if(x.re.test(text)){score+=x.points;risks.push(x.label)}
 const st=stage.toLowerCase();
 if(/negocia|fech/.test(st))score+=18;
 if(/produto|apresent/.test(st))score+=8;
 if(budget)score+=5;
 score=Math.max(0,Math.min(100,score));
 const temperature=score>=70?"quente":score>=40?"morna":"fria";
 const closingMoment=score>=70||signals.includes("Sinal explícito de compra");
 let nextAction="";
 if(closingMoment)nextAction="Pare de acrescentar argumentos. Confirme a escolha e conduza para condição de pagamento/fechamento.";
 else if(risks.some(x=>x.includes("preço")||x.includes("parcela")))nextAction="Descubra a faixa confortável de parcela ou entrada antes de trocar de produto.";
 else if(temperature==="morna")nextAction="Confirme a principal necessidade e faça uma pergunta de avanço: “Esse modelo atende o que você precisa?”";
 else nextAction="Continue a descoberta. Faça perguntas antes de apresentar mais características.";
 return {score,temperature,signals:[...new Set(signals)],risks:[...new Set(risks)],nextAction,closingMoment};
}
