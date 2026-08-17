export type Difficulty="normal"|"dificil"|"extremo";
export type SimCustomer={name:string;need:string;budget:number;hidden:string;objection:string;opening:string};

const customers:SimCustomer[]=[
 {name:"Cliente econômico",need:"Precisa trocar o fogão",budget:900,hidden:"Tem pouco espaço na cozinha",objection:"Achei caro. Vou pesquisar em outra loja.",opening:"Boa tarde. Estou olhando um fogão, mas não queria gastar muito."},
 {name:"Cliente da parcela",need:"Quer uma geladeira",budget:2400,hidden:"Só consegue pagar até R$ 220 por mês",objection:"Essa parcela ficou pesada pra mim.",opening:"Quero uma geladeira boa, mas o que importa mesmo é caber no mês."},
 {name:"Cliente indeciso",need:"Está montando a casa",budget:3500,hidden:"Pode comprar mais de um item se enxergar vantagem",objection:"Vou pensar e depois volto.",opening:"Estou olhando algumas coisas pra casa nova, ainda não sei o que vou levar."},
 {name:"Cliente técnico",need:"Procura uma lavadora",budget:2200,hidden:"Valoriza capacidade e durabilidade",objection:"Mas o que esse modelo tem de melhor que o outro?",opening:"Quero comparar duas máquinas. Não quero comprar só pela marca."}
];

export function randomCustomer(){return customers[Math.floor(Math.random()*customers.length)]}
export function customerReply(c:SimCustomer,message:string,d:Difficulty,turn:number){
 const m=message.toLowerCase();
 if(/quanto|orçamento|orcamento|investir|gastar|faixa/.test(m))return `Eu queria ficar por volta de R$ ${c.budget}.`;
 if(/espaço|espaco|medida|tamanho|cabe/.test(m))return c.hidden.includes("espaço")?c.hidden:"Ainda não medi certinho.";
 if(/uso|precisa|procurando|prioridade|importante/.test(m))return `${c.need}. ${turn>1?c.hidden:""}`.trim();
 if(/parcela|por mês|mensal|entrada/.test(m))return c.hidden.includes("mês")?c.hidden:"Quero ver uma condição que não pese.";
 if(/posso fechar|vamos fechar|levar hoje|fazer o pedido/.test(m))return turn>=4?"Se a condição ficar boa, pode fazer.":d==="normal"?"Talvez. Me explica só mais uma coisa.":"Calma, ainda não decidi.";
 if(turn>=3&&(d==="dificil"||d==="extremo"))return c.objection;
 if(d==="extremo"&&turn===2)return "Você está me fazendo muita pergunta. Só me mostra o melhor preço.";
 return turn===1?"Quero entender melhor antes de decidir.":"Entendi. E qual seria a vantagem pra mim?";
}

export function scoreSimulation(messages:{role:"seller"|"customer";text:string}[]){
 const seller=messages.filter(x=>x.role==="seller").map(x=>x.text).join(" ");
 const questions=(seller.match(/\?/g)||[]).length;
 let discovery=0;
 if(/uso|precisa|procurando|prioridade/.test(seller.toLowerCase()))discovery+=25;
 if(/orçamento|orcamento|gastar|investir|valor/.test(seller.toLowerCase()))discovery+=25;
 if(/espaço|espaco|medida|tamanho/.test(seller.toLowerCase()))discovery+=25;
 if(/parcela|entrada|mensal/.test(seller.toLowerCase()))discovery+=25;
 let objection=/entendo|qual valor|o que.*compar|qual.*dúvida|qual.*duvida/i.test(seller)?75:40;
 let closing=/fechar|pedido|levar hoje|condição|condicao/i.test(seller)?80:45;
 let listening=Math.min(100,35+questions*12);
 const total=Math.round((discovery+objection+closing+listening)/4);
 return {total,discovery,objection,closing,listening};
}
