export type CustomerProfile={
 price:number; installment:number; quality:number; technical:number; objective:number;
 label:string; signals:string[]; needs:string[];
};

const tests=[
 {k:"price",terms:["barato","mais em conta","preço","valor","desconto","promoção"]},
 {k:"installment",terms:["parcela","parcelar","crediário","crediario","por mês","mensal","entrada"]},
 {k:"quality",terms:["qualidade","durável","durabilidade","melhor","resistente","marca boa"]},
 {k:"technical",terms:["potência","potencia","litros","rpm","w","voltagem","função","funções","tecnologia"]},
 {k:"objective",terms:["preciso","quero","cabe","espaço","familia","família","casa","cozinha","quarto"]}
] as const;

export function analyzeCustomer(text:string,objective=""):CustomerProfile{
 const all=`${text} ${objective}`.toLowerCase();
 const scores:any={price:0,installment:0,quality:0,technical:0,objective:0};
 const signals:string[]=[];
 for(const t of tests)for(const term of t.terms)if(all.includes(term)){scores[t.k]+=1;signals.push(term)}
 const ordered=Object.entries(scores).sort((a:any,b:any)=>b[1]-a[1]);
 const label=ordered[0][1]===0?"Ainda indefinido":
  ordered[0][0]==="price"?"Focado em preço":
  ordered[0][0]==="installment"?"Focado na parcela":
  ordered[0][0]==="quality"?"Focado em qualidade":
  ordered[0][0]==="technical"?"Perfil técnico":"Focado no objetivo";
 const needs:string[]=[];
 if(/cozinha|fogão|fogao/.test(all))needs.push("Organização/estrutura da cozinha");
 if(/casa nova|mudança|mudanca|casando|casamento/.test(all))needs.push("Possível montagem de ambiente/casa");
 if(/familia|família|criança|crianca/.test(all))needs.push("Capacidade e praticidade para a família");
 if(/pequeno|apertado|pouco espaço|pouco espaco/.test(all))needs.push("Limitação de espaço");
 if(/parcela|por mês|mensal/.test(all))needs.push("Limite mensal de pagamento");
 if(/quebrou|urgente|hoje/.test(all))needs.push("Necessidade urgente");
 return {...scores,label,signals:[...new Set(signals)].slice(0,8),needs:[...new Set(needs)]};
}
