export type ConversationQuality={
 questions:number; notes:number; discovery:number; talkRisk:"baixo"|"médio"|"alto";
 missing:string[]; score:number; advice:string;
};

export function analyzeConversation(notes:string[],objective:string,budget:string,stage:string):ConversationQuality{
 const text=notes.join(" ").trim();
 const questions=(text.match(/\?/g)||[]).length;
 const noteCount=notes.filter(x=>x.trim()).length;
 const hasUse=/uso|usar|precisa|preciso|quero|objetivo|dia a dia/i.test(text+" "+objective);
 const hasBudget=Boolean(budget)||/preço|valor|parcela|entrada|orçamento|orcamento/i.test(text);
 const hasSpace=/medida|tamanho|espaço|espaco|cabe/i.test(text);
 const hasPreference=/prefere|gosta|marca|cor|modelo|qualidade/i.test(text);
 const hasTiming=/hoje|urgente|entrega|quando|prazo/i.test(text);
 const found=[hasUse,hasBudget,hasSpace,hasPreference,hasTiming].filter(Boolean).length;
 const discovery=Math.round(found/5*100);
 const missing:string[]=[];
 if(!hasUse)missing.push("como o cliente vai usar");
 if(!hasBudget)missing.push("faixa de orçamento/parcela");
 if(!hasSpace)missing.push("medidas ou espaço disponível");
 if(!hasPreference)missing.push("preferências e prioridades");
 if(!hasTiming)missing.push("prazo/urgência");
 const longStatements=notes.filter(n=>n.split(/\s+/).length>35).length;
 const talkIndex=longStatements*2 + Math.max(0,noteCount-questions*3);
 const talkRisk=talkIndex>=6?"alto":talkIndex>=3?"médio":"baixo";
 let score=Math.round(discovery*.65 + Math.min(35,questions*9));
 if(talkRisk==="alto")score-=15;
 score=Math.max(0,Math.min(100,score));
 const advice=talkRisk==="alto"
  ?"⚠️ Você pode estar falando demais. Faça uma pergunta curta e deixe o cliente desenvolver a resposta."
  :missing.length?`Pergunte agora sobre ${missing[0]}.`
  :"Boa descoberta. Resuma o que entendeu e confirme com o cliente antes de avançar.";
 return {questions,notes:noteCount,discovery,talkRisk,missing,score,advice};
}
