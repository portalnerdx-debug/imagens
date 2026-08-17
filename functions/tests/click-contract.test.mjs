import test from "node:test";
import assert from "node:assert/strict";

function num(v){if(v===undefined||v===null||v==="")return undefined;const n=Number(String(v).replace(",","."));return Number.isFinite(n)?n:undefined}
function normalizeProduct(raw,requestedCode){
 return {code:String(raw?.code??raw?.codigo??requestedCode),name:String(raw?.name??raw?.nome??raw?.description??raw?.descricao??"Produto"),price:num(raw?.price??raw?.preco),stock:num(raw?.stock??raw?.estoque)};
}
function normalizeCredit(raw,input){
 const entry=num(raw?.entry??raw?.entrada)??input.entry??0;
 const installmentValue=num(raw?.installmentValue??raw?.valorParcela??raw?.parcela);
 const total=num(raw?.total??raw?.valorTotal);
 if(installmentValue===undefined||total===undefined)throw new Error("CLICK_INVALID_CREDIT_RESPONSE");
 return {...input,entry,installmentValue,total};
}
test("normaliza produto em português",()=>{
 assert.deepEqual(normalizeProduct({codigo:"123",nome:"Fogão",preco:"999,90",estoque:"2"},"x"),{code:"123",name:"Fogão",price:999.9,stock:2});
});
test("normaliza crediário",()=>{
 const r=normalizeCredit({entrada:100,valorParcela:"90,00",valorTotal:1000},{productCode:"1",plan:"CT2",installments:10,entry:100});
 assert.equal(r.installmentValue,90); assert.equal(r.total,1000);
});
test("rejeita resposta financeira incompleta",()=>{
 assert.throws(()=>normalizeCredit({entrada:0},{productCode:"1",plan:"CT1",installments:10}),/CLICK_INVALID_CREDIT_RESPONSE/);
});
