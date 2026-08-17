import {initializeApp} from "firebase-admin/app";
import {onCall,HttpsError} from "firebase-functions/v2/https";
import {createClickAdapter} from "./clickAdapter.js";
import {normalizeProduct,normalizeCredit} from "./clickTypes.js";
import {CLICK_USERNAME,CLICK_PASSWORD} from "./clickConfig.js";
initializeApp();
const click=createClickAdapter();

function requireAuth(auth:unknown){
 if(!auth)throw new HttpsError("unauthenticated","Faça login no XVendas.");
}
export const lookupClickProduct=onCall({region:"southamerica-east1",secrets:[CLICK_USERNAME,CLICK_PASSWORD]},async req=>{
 requireAuth(req.auth);
 const code=String(req.data?.code||"").trim();
 if(!/^[A-Za-z0-9._-]{1,40}$/.test(code))throw new HttpsError("invalid-argument","Código de produto inválido.");
 try{return normalizeProduct(await click.lookupProduct({code}),code)}
 catch(e:any){
  if(["CLICK_INTEGRATION_NOT_CONFIGURED","CLICK_BASE_URL_NOT_CONFIGURED","CLICK_AUTHORIZED_PROTOCOL_NOT_CONFIGURED"].includes(e?.message))
   throw new HttpsError("failed-precondition","Integração autorizada com a Plataforma Click ainda não configurada.");
  throw new HttpsError("internal","Falha ao consultar o produto.");
 }
});
export const simulateClickCredit=onCall({region:"southamerica-east1",secrets:[CLICK_USERNAME,CLICK_PASSWORD]},async req=>{
 requireAuth(req.auth);
 const d=req.data||{}, plan=String(d.plan||"");
 const installments=Number(d.installments);
 const cpf=String(d.cpf||"").replace(/\D/g,"");
 if(!["48","CT1","CT2"].includes(plan))throw new HttpsError("invalid-argument","Plano inválido.");
 if(!Number.isInteger(installments)||installments<1||installments>48)throw new HttpsError("invalid-argument","Parcelas inválidas.");
 if(cpf.length!==11)throw new HttpsError("invalid-argument","CPF inválido.");
 if(plan==="CT2"&&!(Number(d.entry)>0))throw new HttpsError("invalid-argument","CT2 exige entrada.");
 try{
  const input={
   productCode:String(d.productCode||""),plan:plan as "48"|"CT1"|"CT2",
   installments,entry:plan==="CT2"?Number(d.entry):undefined,
   voltage:d.voltage?String(d.voltage):undefined,warranty:Boolean(d.warranty),cpf
  };
  return normalizeCredit(await click.simulateCredit(input),input);
 }catch(e:any){
  if(["CLICK_INTEGRATION_NOT_CONFIGURED","CLICK_BASE_URL_NOT_CONFIGURED","CLICK_AUTHORIZED_PROTOCOL_NOT_CONFIGURED"].includes(e?.message))
   throw new HttpsError("failed-precondition","Integração autorizada com a Plataforma Click ainda não configurada.");
  throw new HttpsError("internal","Falha ao simular o crediário.");
 }
});
