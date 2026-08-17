import test from "node:test";
import assert from "node:assert/strict";

const validCode=c=>/^[A-Za-z0-9._-]{1,40}$/.test(c);
const validCpf=c=>/^\d{11}$/.test(c);
function validateCredit(plan,n,entry){
 if(!["48","CT1","CT2"].includes(plan))return "INVALID_PLAN";
 if(!Number.isInteger(n)||n<1||n>48)return "INVALID_INSTALLMENTS";
 if(plan==="CT2"&&!(Number(entry)>0))return "ENTRY_REQUIRED";
 return null;
}
test("código de produto",()=>{assert.equal(validCode("ABC-123"),true);assert.equal(validCode("<script>"),false)});
test("CPF somente 11 dígitos",()=>{assert.equal(validCpf("12345678901"),true);assert.equal(validCpf("123"),false)});
test("CT1 não exige entrada",()=>assert.equal(validateCredit("CT1",10),null));
test("CT2 exige entrada",()=>assert.equal(validateCredit("CT2",10), "ENTRY_REQUIRED"));
test("parcelas de 1 a 48",()=>{assert.equal(validateCredit("48",48),null);assert.equal(validateCredit("48",49),"INVALID_INSTALLMENTS")});
