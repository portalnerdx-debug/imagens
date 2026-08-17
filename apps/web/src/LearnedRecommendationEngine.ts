import {learnPairs,learnStrategies,confidenceLabel} from "./SalesIntelligence";

export type LearnedRecommendation={
 title:string;reason:string;confidence:"baixa"|"média"|"alta";score:number;
 productCode?:string;action:string;
};

export function buildLearnedRecommendations(rows:any[],currentCodes:string[],availableCodes:Set<string>):LearnedRecommendation[]{
 const pairs=learnPairs(rows),strategies=learnStrategies(rows);
 const recs:LearnedRecommendation[]=[];
 for(const current of currentCodes){
  for(const p of pairs.filter(x=>x.a===current||x.b===current)){
   const other=p.a===current?p.b:p.a;
   if(currentCodes.includes(other)||!availableCodes.has(other))continue;
   const confidence=confidenceLabel(p.count);
   const weight=confidence==="alta"?1:confidence==="média"?.75:.4;
   recs.push({title:"Venda combinada aprendida",reason:`Essa combinação apareceu ${p.count} vez(es) e fechou ${p.rate}% dos registros.`,confidence,score:p.rate*weight,productCode:other,action:`Considere apresentar ${other} como complemento, se fizer sentido para a necessidade.`});
  }
 }
 const best=strategies.filter(x=>x.name!=="Não informado"&&x.count>=3)[0];
 if(best){
  const confidence=confidenceLabel(best.count),weight=confidence==="alta"?1:confidence==="média"?.75:.4;
  recs.push({title:"Abordagem aprendida",reason:`“${best.name}” teve ${best.rate}% de conversão em ${best.count} registros.`,confidence,score:best.rate*weight,action:`Use ${best.name.toLowerCase()} como abordagem, desde que combine com o perfil atual.`});
 }
 return recs.sort((a,b)=>b.score-a.score).slice(0,5);
}
