export type CreditResultRequest={
 code:string;
 plan:"48"|"CT1"|"CT2";
 installments:number;
 downPayment?:number;
};

function moneyNumber(value:string){
 const parsed=Number(value.replace(/\./g,"").replace(",","."));
 return Number.isFinite(parsed)?parsed:undefined;
}

function moneyValues(text:string){
 return [...text.matchAll(/R\$\s*([\d.]+,\d{2})/g)]
  .map(match=>({raw:match[0],value:moneyNumber(match[1])}))
  .filter((item):item is {raw:string;value:number}=>item.value!==undefined);
}

export function parseCt2MinimumEntry(text:string){
 const match=text.match(/M[ií]nimo\s+R\$\s*([\d.]+,\d{2})/i);
 return match?moneyNumber(match[1]):undefined;
}

export function formatBrazilianMoney(value:number){
 return value.toFixed(2).replace(".",",");
}

export function extractCreditResult(text:string,req:CreditResultRequest){
 const values=moneyValues(text);
 if(req.plan==="CT2"||req.plan==="48"){
  const entryTotal=text.match(/Total\s+Entrada\s*:\s*R\$\s*([\d.]+,\d{2})/i);
  const financedTotal=text.match(/Total\s+Parcelas\s*:\s*R\$\s*([\d.]+,\d{2})/i);
  const detailMatches=[...text.matchAll(/(\d+)\s*x\s*(?:de\s*)?R\$\s*([\d.]+,\d{2})/gi)]
   .map(match=>({installments:Number(match[1]),value:moneyNumber(match[2])}));
  const expected=Math.max(1,req.installments-1);
  const financing=detailMatches.find(item=>item.installments===expected)
   || [...detailMatches].reverse().find(item=>item.installments>1);
  const entry=(entryTotal?moneyNumber(entryTotal[1]):undefined)??Number(req.downPayment||0);
  const financed=financedTotal?moneyNumber(financedTotal[1]):undefined;
  const total=financed===undefined?undefined:Math.round((entry+financed)*100)/100;
  return {
   productCode:req.code,plan:req.plan,
   requestedInstallments:req.installments,
   installments:financing?.installments??expected,
   entry,
   installmentValue:financing?.value,
   financedTotal:financed,total,
   capturedValues:values.slice(-15)
  };
 }

 // Algumas respostas da Click omitem o prefixo R$ na coluna "Detalhes".
 const installmentRegex=new RegExp(`${req.installments}\\s*x\\s*(?:de\\s*)?(?:R\\$\\s*)?([\\d.]+,\\d{2})`,"i");
 const installmentMatch=text.match(installmentRegex);
 const totalMatch=text.match(/(?:total|valor total)\s*:\s*R\$\s*([\d.]+,\d{2})/i)
  || text.match(/(?:total|valor total)[^R$]{0,60}R\$\s*([\d.]+,\d{2})/i);

 return {
  productCode:req.code,
  plan:req.plan,
  installments:req.installments,
  entry:0,
  installmentValue:installmentMatch?moneyNumber(installmentMatch[1]):undefined,
  total:totalMatch?moneyNumber(totalMatch[1]):undefined,
  capturedValues:values.slice(-15)
 };
}
