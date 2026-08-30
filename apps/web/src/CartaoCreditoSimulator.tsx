import React,{useEffect,useState} from "react";
import {simulateClickCard} from "./ClickGateway";
import "./credit-progress.css";

const DEFAULT_CPF="10304987506";
const ccsPhases=["Iniciando sessão da Plataforma Click","Localizando o produto","Adicionando o produto principal","Verificando voltagem (se necessária)","Enviando CPF","Configurando CCS — cartão sem entrada","Calculando parcelas","Finalizando consulta"] as const;
const cccPhases=["Iniciando sessão da Plataforma Click","Localizando o produto","Adicionando o produto principal","Verificando voltagem (se necessária)","Enviando CPF","Criando CCC — cartão com entrada","Aplicando entrada em dinheiro","Configurando T CREDITO nas parcelas","Selecionando bandeira MASTERCARD","Calculando valor das parcelas","Finalizando consulta"] as const;
function money(value:any){return Number(value).toFixed(2).replace(".",",");}
function friendlyError(e:any){return String(e?.message||e||"Não foi possível consultar o cartão de crédito agora.");}
export function CartaoCreditoSimulator(){
 const [code,setCode]=useState(""),[plan,setPlan]=useState<"CCS"|"CCC">("CCS"),[installments,setInstallments]=useState(10),[entry,setEntry]=useState(""),[voltage,setVoltage]=useState(""),[cpf,setCpf]=useState(DEFAULT_CPF),[loading,setLoading]=useState(false),[error,setError]=useState(""),[result,setResult]=useState<any>(null),[progressIndex,setProgressIndex]=useState(-1);
 const phases=plan==="CCC"?cccPhases:ccsPhases;
 useEffect(()=>{if(!loading){setProgressIndex(-1);return}setProgressIndex(0);const t=window.setInterval(()=>setProgressIndex(c=>Math.min(c+1,phases.length-2)),1100);return()=>window.clearInterval(t)},[loading,plan,phases.length]);
 async function simulate(){
  setError("");setResult(null);const clean=code.trim(),cleanCpf=cpf.replace(/\D/g,"");
  if(!clean){setError("Digite o código do produto.");return} if(cleanCpf.length!==11){setError("Digite um CPF com 11 números.");return}
  const min=plan==="CCC"?2:1;if(!Number.isInteger(installments)||installments<min||installments>24){setError(`Escolha de ${min} a 24 ${plan==="CCC"?"pagamentos":"parcelas"}.`);return}
  const entryValue=Number(entry.replace(/\./g,"").replace(",","."))||0;if(plan==="CCC"&&entryValue<=0){setError("Informe a entrada em dinheiro.");return}
  setLoading(true);try{
   window.postMessage({source:"XVENDAS_CLICK",payload:{mode:"card",productCode:clean,plan,installments,entry:plan==="CCC"?entryValue:undefined,voltage:voltage||undefined,cpf:cleanCpf}},window.location.origin);
   setProgressIndex(phases.length-1);setResult({productCode:clean,plan,installments,entry:plan==="CCC"?entryValue:undefined,message:"Automação enviada para a nova aba da Plataforma Click."});
  }catch(e){setError(friendlyError(e))}finally{setLoading(false)}
 }
 const currentPhase=loading?phases[Math.max(progressIndex,0)]:result?"Consulta enviada":"Aguardando consulta";
 return <section className="creditSimulator"><div className="creditHead"><div><span className="step">💳 Cartão</span><h3>Consultar cartão de crédito</h3></div><span>{plan==="CCS"?"Sem entrada":"Com entrada"} • 1 a 24</span></div><div className="creditGrid"><label className="cpfField">Código do produto<input value={code} onChange={e=>setCode(e.target.value)} inputMode="numeric"/></label><label>Condição<select value={plan} onChange={e=>setPlan(e.target.value as "CCS"|"CCC")}><option value="CCS">CCS — Cartão sem entrada</option><option value="CCC">CCC — Cartão com entrada</option></select></label><label>Parcelas<input type="number" value={installments} onChange={e=>setInstallments(Number(e.target.value))}/></label>{plan==="CCC"&&<label>Entrada<input value={entry} onChange={e=>setEntry(e.target.value)}/></label>}<label>Voltagem<select value={voltage} onChange={e=>setVoltage(e.target.value)}><option value="">Não se aplica</option><option value="110">110/127V</option><option value="220">220V</option></select></label><label className="cpfField">CPF<input value={cpf} onChange={e=>setCpf(e.target.value)}/></label></div>{loading&&<div className="creditProgress"><strong>{currentPhase}</strong></div>}<button className="primary creditAction" onClick={simulate} disabled={loading}>{loading?"Enviando...":"Consultar cartão de crédito"}</button>{error&&<div className="creditError">{error}</div>}{result&&<div className="creditResult"><p>{result.message}</p></div>}</section>;
}