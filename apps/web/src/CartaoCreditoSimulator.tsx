import React,{useEffect,useState} from "react";
import {simulateClickCard} from "./ClickGateway";
import "./credit-progress.css";

const DEFAULT_CPF="10304987506";
const ccsPhases=["Iniciando sessão da Plataforma Click","Localizando o produto","Adicionando o produto principal","Verificando voltagem (se necessária)","Enviando CPF","Configurando CCS — cartão sem entrada","Calculando parcelas","Finalizando consulta"] as const;
const cccPhases=["Iniciando sessão da Plataforma Click","Localizando o produto","Adicionando o produto principal","Verificando voltagem (se necessária)","Enviando CPF","Criando CCC — cartão com entrada","Aplicando entrada em dinheiro","Configurando T CREDITO nas parcelas","Selecionando bandeira MASTERCARD","Calculando valor das parcelas","Finalizando consulta"] as const;
function money(value:any){return Number(value).toFixed(2).replace(".",",");}
function friendlyError(e:any){
 const raw=String(e?.message||e||"");
 if(raw.includes("PRODUCT_NOT_FOUND"))return "Produto não encontrado na Plataforma Click.";
 if(raw.includes("CARD_VOLTAGE_REQUIRED"))return "Este produto exige uma voltagem. Selecione a voltagem antes da consulta.";
 if(raw.includes("CARD_VOLTAGE_OPTION_NOT_FOUND"))return "A Plataforma Click pediu voltagem, mas a opção não foi localizada.";
 if(raw.includes("CARD_INSTALLMENTS_OUT_OF_RANGE"))return "O cartão de crédito permite de 1 a 24 parcelas.";
 if(raw.includes("CARD_ENTRY_REQUIRED"))return "Informe um valor maior que zero para a entrada do cartão.";
 if(raw.includes("CARD_CPF_SUBMIT_FAILED"))return "A Plataforma Click não aceitou o CPF para abrir as condições.";
 if(raw.includes("CARD_PAYMENT_SETUP_FAILED"))return "A Plataforma Click não conseguiu abrir a condição de cartão.";
 if(raw.includes("CARD_PAYMENT_ID_NOT_FOUND"))return "A Plataforma Click não identificou os pagamentos da condição.";
 if(raw.includes("CARD_ENTRY_PAYMENT_FAILED"))return "Não foi possível aplicar o valor em dinheiro na entrada.";
 if(raw.includes("CARD_INSTALLMENT_PAYMENT_FAILED"))return "Não foi possível configurar o T CREDITO nas parcelas.";
 if(raw.includes("CARD_RESULT_NOT_PARSED"))return "A condição de cartão foi aberta, mas o valor da parcela não foi identificado.";
 return raw||"Não foi possível consultar o cartão de crédito agora.";
}

export function CartaoCreditoSimulator(){
 const [code,setCode]=useState("");
 const [plan,setPlan]=useState<"CCS"|"CCC">("CCS");
 const [installments,setInstallments]=useState(10);
 const [entry,setEntry]=useState("");
 const [voltage,setVoltage]=useState("");
 const [cpf,setCpf]=useState(DEFAULT_CPF);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");
 const [result,setResult]=useState<any>(null);
 const [progressIndex,setProgressIndex]=useState(-1);
 const phases=plan==="CCC"?cccPhases:ccsPhases;

 useEffect(()=>{
  if(!loading){setProgressIndex(-1);return}
  setProgressIndex(0);
  const timer=window.setInterval(()=>setProgressIndex(current=>Math.min(current+1,phases.length-2)),1100);
  return()=>window.clearInterval(timer);
 },[loading,plan,phases.length]);

 async function simulate(){
  const resultTab=window.open("about:blank","_blank");
  setError("");setResult(null);
  const clean=code.trim(), cleanCpf=cpf.replace(/\D/g,"");
  if(!clean){setError("Digite o código do produto.");return;}
  if(cleanCpf.length!==11){setError("Digite um CPF com 11 números.");return;}
  const min=plan==="CCC"?2:1;
  if(!Number.isInteger(installments)||installments<min||installments>24){setError(`Escolha de ${min} a 24 ${plan==="CCC"?"pagamentos":"parcelas"}.`);return;}
  const entryValue=Number(entry.replace(/\./g,"").replace(",","."))||0;
  if(plan==="CCC"&&entryValue<=0){setError("Informe a entrada em dinheiro.");return;}
  setLoading(true);
  try{
   const data=await simulateClickCard({productCode:clean,plan,installments,...(plan==="CCC"?{entry:entryValue}:{}),voltage:voltage||undefined,cpf:cleanCpf});
   setProgressIndex(phases.length-1);
   setResult(data);
   if(data?.clickUrl&&resultTab){
    resultTab.location.replace(data.clickUrl);
   }else if(resultTab){
    resultTab.close();
   }
  }catch(e){if(resultTab)resultTab.close();setError(friendlyError(e))}
  finally{setLoading(false)}
 }

 const currentPhase=loading?phases[Math.max(progressIndex,0)]:result?"Consulta concluída":"Aguardando consulta";
 const progressPercent=loading?Math.min(94,Math.max(5,Math.round(((progressIndex+1)/phases.length)*100))):result?100:0;
 return <section className="creditSimulator">
  <div className="creditHead"><div><span className="step">💳 Cartão</span><h3>Consultar cartão de crédito</h3></div><span>{plan==="CCS"?"Sem entrada":"Com entrada"} • 1 a 24</span></div>
  <div className="creditGrid">
   <label className="cpfField">Código do produto<input value={code} onChange={e=>setCode(e.target.value)} inputMode="numeric" placeholder="Ex.: 412100"/></label>
   <label>Condição<select value={plan} onChange={e=>{const v=e.target.value as "CCS"|"CCC";setPlan(v);if(v==="CCC"&&installments<2)setInstallments(2)}}><option value="CCS">CCS — Cartão sem entrada</option><option value="CCC">CCC — Cartão com entrada</option></select></label>
   <label>{plan==="CCC"?"Pagamentos totais (entrada + parcelas)":"Parcelas"}<input type="number" min={plan==="CCC"?2:1} max="24" value={installments} onChange={e=>setInstallments(Number(e.target.value))}/></label>
   {plan==="CCC"&&<label>Entrada em dinheiro<input value={entry} onChange={e=>setEntry(e.target.value)} inputMode="decimal" placeholder="R$ 20,00"/></label>}
   <label>Voltagem<select value={voltage} onChange={e=>setVoltage(e.target.value)}><option value="">Não se aplica / escolher depois</option><option value="110">110/127V</option><option value="220">220V</option></select></label>
   <label className="cpfField">CPF para consulta<input value={cpf} onChange={e=>setCpf(e.target.value)} inputMode="numeric" autoComplete="off" placeholder="CPF usado na consulta"/></label>
  </div>
  {loading&&<div className="creditProgress" aria-live="polite"><div className="creditProgressTop"><strong>{currentPhase}</strong><span>{progressPercent}%</span></div><div className="creditProgressBar"><span style={{width:`${progressPercent}%`}}/></div><div className="creditProgressList">{phases.map((phase,index)=><div key={phase} className={index<progressIndex?"done":index===progressIndex?"active":"pending"}><span>{index<progressIndex?"✓":index===progressIndex?"●":"○"}</span>{phase}{plan==="CCC"&&phase.includes("entrada")&&<b>R$ {entry||"0,00"}</b>}</div>)}</div></div>}
  <p className="creditSafety"><strong>{plan==="CCC"?"CCC configurado":"Sem adicionais"}</strong><span>{plan==="CCC"?"A entrada é paga em dinheiro; as parcelas usam 200 - T CREDITO e a bandeira MASTERCARD.":"O produto informado é consultado individualmente, sem produtos auxiliares, prestamista ou garantia."}</span></p>
  <button className="primary creditAction" onClick={simulate} disabled={loading}>{loading?"Consultando cartão...":"Consultar cartão de crédito"}</button>
  {error&&<div className="creditError">{error}</div>}
  {result&&<div className="creditResult creditReceipt">
   <div><small>Produto</small><strong>{result.productCode}</strong></div>
   <div><small>Condição</small><strong>{result.plan}</strong></div>
   {result.entry!==undefined&&<div><small>Entrada</small><strong>R$ {money(result.entry)} em dinheiro</strong></div>}
   <div><small>Parcelas</small><strong>{result.installments}x de R$ {money(result.installmentValue)}</strong></div>
   {result.cardForm&&<div><small>Forma</small><strong>{result.cardForm}</strong></div>}
   {result.brand&&<div><small>Bandeira</small><strong>{result.brand}</strong></div>}
   <div><small>Total</small><strong>{result.total!==undefined?`R$ ${money(result.total)}`:"—"}</strong></div>
   <p>{result.message}</p>
  </div>}
 </section>;
}
