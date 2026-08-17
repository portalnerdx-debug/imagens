export type TrainingArea={
 key:string;label:string;score:number;tip:string;
};

export function buildTrainingAreas(args:{
 discovery:number;questions:number;closing:number;
 objectionCount:number;objectionWon:number;lostCount:number;
}):TrainingArea[]{
 const recovery=args.objectionCount?Math.round(args.objectionWon/args.objectionCount*100):50;
 const discovery=Math.max(0,Math.min(100,args.discovery));
 const listening=Math.max(0,Math.min(100,40+args.questions*10));
 const closing=Math.max(0,Math.min(100,args.closing));
 const objection=Math.max(0,Math.min(100,recovery));
 const lossLearning=Math.max(0,Math.min(100,args.lostCount?65:45));
 return [
  {key:"discovery",label:"Descoberta",score:discovery,tip:"Faça perguntas sobre uso, orçamento, espaço, preferência e prazo."},
  {key:"listening",label:"Perguntas e escuta",score:listening,tip:"Faça perguntas curtas e evite apresentar solução antes de entender o cliente."},
  {key:"closing",label:"Fechamento",score:closing,tip:"Quando surgirem sinais de compra, pare de adicionar argumentos e conduza para a condição."},
  {key:"objections",label:"Objeções",score:objection,tip:"Descubra a causa real da objeção antes de desconto, troca de produto ou nova condição."},
  {key:"losses",label:"Aprendizado com perdas",score:lossLearning,tip:"Registre por que a venda foi perdida e escolha um comportamento específico para corrigir."}
 ];
}

export function overallScore(areas:TrainingArea[]){
 return Math.round(areas.reduce((s,a)=>s+a.score,0)/Math.max(1,areas.length));
}
