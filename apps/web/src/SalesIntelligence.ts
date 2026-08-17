export type LearnedSale={
 won:boolean; value:number; additionalItems:number;
 productCodes?:string[]; approach?:string; objection?:string;
};
export type PairInsight={a:string;b:string;count:number;wins:number;rate:number};
export type StrategyInsight={name:string;count:number;wins:number;rate:number;avgTicket:number};

export function learnPairs(rows:LearnedSale[]):PairInsight[]{
 const m=new Map<string,{count:number;wins:number}>();
 for(const r of rows){
  const codes=[...new Set(r.productCodes||[])].filter(Boolean).sort();
  for(let i=0;i<codes.length;i++)for(let j=i+1;j<codes.length;j++){
   const key=`${codes[i]}|||${codes[j]}`,v=m.get(key)||{count:0,wins:0};
   v.count++;if(r.won)v.wins++;m.set(key,v);
  }
 }
 return [...m.entries()].map(([k,v])=>{const [a,b]=k.split("|||");return {a,b,...v,rate:Math.round(v.wins/v.count*100)}}).sort((x,y)=>y.wins-x.wins||y.rate-x.rate);
}
export function learnStrategies(rows:LearnedSale[]):StrategyInsight[]{
 const m=new Map<string,{count:number;wins:number;revenue:number}>();
 for(const r of rows){
  const name=(r.approach||"Não informado").trim()||"Não informado";
  const v=m.get(name)||{count:0,wins:0,revenue:0};v.count++;if(r.won){v.wins++;v.revenue+=Number(r.value||0)};m.set(name,v);
 }
 return [...m.entries()].map(([name,v])=>({name,count:v.count,wins:v.wins,rate:Math.round(v.wins/v.count*100),avgTicket:v.wins?v.revenue/v.wins:0})).sort((a,b)=>b.rate-a.rate||b.count-a.count);
}
export function confidenceLabel(count:number){return count>=20?"alta":count>=8?"média":"baixa"}
