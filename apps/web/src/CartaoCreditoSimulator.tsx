import React,{useState} from "react";
import {simulateClickCard} from "./ClickGateway";

const DEFAULT_CPF="10304987506";

function money(value:any){return Number(value).toFixed(2).replace(".",",");}
function friendlyError(e:any){
 const raw=String(e?.message||e||"");
 if(raw.includes("PRODUCT_NOT_FOUND"))return "Produto não encontrado na Plataforma Click.";
 if(raw.includes("VOLTAGE_REQUIRED")||raw.includes("CARD_VOLTAGE_REQUIRED"))return "Este produto exige uma voltagem. Selecione a voltagem antes da consulta.";
 if(raw.includes("CARD_VOLTAGE_OPTION_NOT_FOUND"))return "A Plataforma Click pediu voltagem, mas a opção não foi localizada.";
 if(raw.includes("CARD_INSTALLMENTS_OUT_OF_RANGE"))return "O cartão de crédito permite de 1 a 24 parcelas.";
 if(raw.includes("CARD_CPF_SUBMIT_FAILED"))return "A Plataforma Click não aceitou o CPF para abrir as condições.";
 if(raw.includes("CARD_PAYMENT_SETUP_FAILED"))return "A Plataforma Click não conseguiu abrir a condição de cartão.";
 if(raw.includes("CARD_RESULT_NOT_PARSED"))return "A condição de cartão foi aberta, mas o valor da parcela não foi identificado.";
 return raw||"Não foi possível consultar o cartão de crédito agora.";
}

export function CartaoCreditoSimulator(){
 const [code,setCode]=useState("");
 const [installments,setInstallments]=useState(10);
 const [voltage,setVoltage]=useState("");
 const [cpf,setCpf]=useState(DEFAULT_CPF);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");
 const [result,setResult]=useState<any>(null);

 async function simulate(){
  setError("");setResult(null);
  const clean=code.trim(), cleanCpf=cpf.replace(/\D/g,"");
  if(!clean){setError("Digite o código do produto.");return;}
  if(cleanCpf.length!==11){setError("Digite um CPF com 11 números.");return;}
  if(!Number.isInteger(installments)||installments<1||installments>24){setError("Escolha de 1 a 24 parcelas.");return;}
  setLoading(true);
  try{
   setResult(await simulateClickCard({productCode:clean,installments,voltage:voltage||undefined,cpf:cleanCpf}));
  }catch(e){setError(friendlyError(e))}
  finally{setLoading(false)}
 }

 return <section className="creditSimulator">
  <div className="creditHead"><div><span className="step">💳 Cartão</span><h3>Consultar cartão de crédito</h3></div><span>1 a 24 parcelas</span></div>
  <div className="creditGrid">
   <label className="cpfField">Código do produto<input value={code} onChange={e=>setCode(e.target.value)} inputMode="numeric" placeholder="Ex.: 412100"/></label>
   <label>Parcelas<input type="number" min="1" max="24" value={installments} onChange={e=>setInstallments(Number(e.target.value))}/></label>
   <label>Voltagem<select value={voltage} onChange={e=>setVoltage(e.target.value)}><option value="">Não se aplica / escolher depois</option><option value="110">110/127V</option><option value="220">220V</option></select></label>
   <label className="cpfField">CPF para consulta<input value={cpf} onChange={e=>setCpf(e.target.value)} inputMode="numeric" autoComplete="off" placeholder="CPF usado na consulta"/></label>
  </div>
  <p className="creditSafety"><strong>Sem adicionais</strong><span>O produto informado é consultado individualmente. Não são adicionados produtos auxiliares, seguro prestamista ou garantia.</span></p>
  <button className="primary creditAction" onClick={simulate} disabled={loading}>{loading?"Consultando cartão...":"Consultar cartão de crédito"}</button>
  {error&&<div className="creditError">{error}</div>}
  {result&&<div className="creditResult creditReceipt">
   <div><small>Produto</small><strong>{result.productCode}</strong></div>
   <div><small>Parcelas</small><strong>{result.installments}x de R$ {money(result.installmentValue)}</strong></div>
   <div><small>Total</small><strong>{result.total!==undefined?`R$ ${money(result.total)}`:"—"}</strong></div>
   <p>{result.message}</p>
  </div>}
 </section>;
}
