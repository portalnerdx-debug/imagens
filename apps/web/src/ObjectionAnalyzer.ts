export function classifyObjection(text:string){
 const t=text.toLowerCase();
 if(/caro|preço|preco|valor/.test(t))return "Preço";
 if(/parcela|mensal|entrada|credi[aá]rio/.test(t))return "Condição de pagamento";
 if(/pensar|volto|depois/.test(t))return "Adiamento";
 if(/esposa|marido|fam[ií]lia|falar com/.test(t))return "Decisor ausente";
 if(/outra loja|internet|concorr/.test(t))return "Concorrência";
 if(/estoque|entrega|prazo/.test(t))return "Disponibilidade";
 if(/marca|qualidade|confian/.test(t))return "Confiança/produto";
 return "Outro";
}
export function suggestedResponse(category:string){
 const map:Record<string,string>={
  "Preço":"Descubra a referência de valor antes de oferecer desconto: “Qual faixa você imaginava investir?”",
  "Condição de pagamento":"Pergunte qual parcela ou entrada fica confortável e ajuste a condição sem perder a necessidade principal.",
  "Adiamento":"Pergunte o que ainda falta decidir: produto, preço, condição ou conversa com alguém.",
  "Decisor ausente":"Ajude o cliente a levar um resumo simples: modelo, benefício principal, preço e condição.",
  "Concorrência":"Descubra o que está sendo comparado e confirme se modelo, prazo, garantia e condição são equivalentes.",
  "Disponibilidade":"Confirme urgência e prazo aceitável antes de sugerir uma alternativa disponível.",
  "Confiança/produto":"Pergunte qual dúvida impede a decisão e responda apenas ao ponto necessário.",
  "Outro":"Valide a objeção e faça uma pergunta curta para descobrir a causa real."
 };
 return map[category]||map.Outro;
}
