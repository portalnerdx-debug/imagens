export type ClickProduct={
 code:string;name:string;price?:number;stock?:number;
 voltageOptions?:string[];brand?:string;
};
export type ClickCreditResult={
 productCode:string;plan:"48"|"CT1"|"CT2";installments:number;
 entry:number;installmentValue:number;total:number;
 message?:string;
};
export function normalizeProduct(raw:any,requestedCode:string):ClickProduct{
 return {
  code:String(raw?.code??raw?.codigo??requestedCode),
  name:String(raw?.name??raw?.nome??raw?.description??raw?.descricao??"Produto"),
  price:num(raw?.price??raw?.preco),
  stock:num(raw?.stock??raw?.estoque),
  voltageOptions:Array.isArray(raw?.voltageOptions)?raw.voltageOptions.map(String):undefined,
  brand:raw?.brand??raw?.marca?String(raw?.brand??raw?.marca):undefined
 };
}
export function normalizeCredit(raw:any,input:{productCode:string;plan:"48"|"CT1"|"CT2";installments:number;entry?:number}):ClickCreditResult{
 const entry=num(raw?.entry??raw?.entrada)??input.entry??0;
 const installmentValue=num(raw?.installmentValue??raw?.valorParcela??raw?.parcela);
 const total=num(raw?.total??raw?.valorTotal);
 if(installmentValue===undefined||total===undefined)throw new Error("CLICK_INVALID_CREDIT_RESPONSE");
 return {productCode:input.productCode,plan:input.plan,installments:input.installments,entry,installmentValue,total,message:raw?.message??raw?.mensagem};
}
function num(v:any){if(v===undefined||v===null||v==="")return undefined;const n=Number(String(v).replace(",", "."));return Number.isFinite(n)?n:undefined}
