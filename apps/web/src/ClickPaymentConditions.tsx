import React,{useMemo,useState} from "react";
import {simulateClickCredit,type ClickCreditResult,type ClickProduct} from "./ClickGateway";

type Plan="48"|"CT1"|"CT2";

const installmentChoices=Array.from({length:48},(_,index)=>index+1);

function money(value?:number){
 if(value===undefined||!Number.isFinite(value))return "—";
 return `R$ ${value.toFixed(2).replace(".",",")}`;
}

function entryNumber(value:string){
 const parsed=Number(value.replace(/\./g,"").replace(",",".").replace(/[^\d.-]/g,""));
 return Number.isFinite(parsed)?parsed:0;
}

function messageForError(error:unknown){
 const raw=String(error instanceof Error?error.message:error||"");
 if(raw.includes("CPF_REQUIRED"))return "Informe um CPF válido para a consulta.";
 if(raw.includes("ENTRY_REQUIRED"))return "Esse plano precisa de uma entrada maior que zero.";
 if(raw.includes("VOLTAGE_REQUIRED"))return "Escolha a voltagem antes de simular.";
 if(raw.includes("CLICK_SESSION_EXPIRED"))return "A sessão da Plataforma Click expirou. Atualize a sessão do robô.";
 if(raw.includes("CT1_INSTALLMENTS_OUT_OF_RANGE"))return "O CT1 permite no máximo 24 parcelas.";
 if(raw.includes("CREDIT_RESULT_NOT_PARSED"))return "O crediário foi aberto, mas o valor da parcela não foi identificado. Tente novamente.";
 if(raw.includes("CREDIT_REQUEST_FAILED"))return "A Plataforma Click não concluiu a consulta CT1. Tente novamente.";
 if(raw.includes("CT1_PRODUCT_PRICE_REQUIRED"))return "Confirme o preço do produto antes de preparar o CT1.";
 if(raw.includes("CT1_CART_PREPARATION_FAILED"))return "Não foi possível preparar os produtos obrigatórios do CT1.";
 if(raw.includes("TRADITIONAL_PRODUCT_PRICE_REQUIRED"))return "Confirme o preço antes de preparar o crediário tradicional.";
 if(raw.includes("TRADITIONAL_CART_PREPARATION_FAILED"))return "Não foi possível preparar os produtos obrigatórios do crediário tradicional.";
 if(raw.includes("WARRANTY_OPTION_NOT_FOUND"))return "A tela de garantia abriu, mas a opção escolhida não foi localizada.";
 if(raw.includes("CPF_SUBMIT_FAILED"))return "A Plataforma Click não aceitou o envio do CPF para abrir as condições CT1.";
 if(raw.includes("WARRANTY_SERVICE_FAILED"))return "A garantia não foi confirmada no carrinho da Plataforma Click.";
 if(raw.includes("CT2_INSTALLMENTS_OUT_OF_RANGE"))return "No CT2, escolha de 2 a 24 pagamentos totais.";
 if(raw.includes("CT2_PAYMENT_SETUP_FAILED"))return "A Plataforma Click não conseguiu abrir o CT2.";
 if(raw.includes("CT2_VARIABLE_ENTRY_FAILED"))return "A Plataforma Click não conseguiu atualizar a entrada variável.";
 if(raw.includes("CT2_PAYMENT_ID_NOT_FOUND"))return "A linha de entrada variável do CT2 não foi identificada.";
 if(raw.includes("CT2_ENTRY_BELOW_MINIMUM"))return "A entrada é menor que o mínimo calculado pela Plataforma Click.";
 if(raw.includes("48_INSTALLMENTS_OUT_OF_RANGE"))return "No Cliente Novo 48, escolha de 2 a 24 pagamentos totais.";
 if(raw.includes("48_PAYMENT_SETUP_FAILED"))return "A Plataforma Click não conseguiu abrir o Cliente Novo 48.";
 if(raw.includes("48_VARIABLE_ENTRY_FAILED"))return "A Plataforma Click não conseguiu atualizar a entrada variável do Cliente Novo 48.";
 if(raw.includes("48_PAYMENT_ID_NOT_FOUND"))return "A linha de entrada variável do Cliente Novo 48 não foi identificada.";
 if(raw.includes("48_ENTRY_BELOW_MINIMUM"))return "A entrada é menor que o mínimo calculado pela Plataforma Click.";
 if(raw.includes("NEW_CUSTOMER_CART_CLEANUP_FAILED"))return "Não foi possível retirar o produto tradicional 447164 do carrinho Cliente Novo.";
 if(raw.includes("AUTH_REQUIRED"))return "Entre no XVendas para consultar as condições.";
 return raw||"Não foi possível simular essa condição agora.";
}

export function ClickPaymentConditions({product}:{product:ClickProduct}){
 const [plan,setPlan]=useState<Plan>("CT1");
 const [installments,setInstallments]=useState(5);
 const [entry,setEntry]=useState("");
 const [cpf,setCpf]=useState("");
 const [voltage,setVoltage]=useState(product.voltageOptions?.[0]?.replace(/[^0-9]/g,"")||"");
 const [warranty,setWarranty]=useState(false);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");
 const [result,setResult]=useState<ClickCreditResult|null>(null);

 const priceLabel=useMemo(()=>money(product.price),[product.price]);

 async function simulate(){
  setError("");setResult(null);
  const cleanCpf=cpf.replace(/\D/g,"");
  if(cleanCpf.length!==11){setError("Digite um CPF com 11 números para fazer a consulta real.");return}
  const down=entryNumber(entry);
  if((plan==="CT2"||plan==="48")&&!(down>0)){setError(`Informe a entrada para o plano ${plan}.`);return}
  setLoading(true);
  try{
   const data=await simulateClickCredit({
    productCode:product.code,plan,installments,
    ...(plan==="CT2"||plan==="48"?{entry:down}:{}),
    ...(voltage?{voltage}:{}),warranty,cpf:cleanCpf
   });
   setResult(data);
   if(!data.ok&&data.message)setError(data.message);
  }catch(e){setError(messageForError(e))}
  finally{setLoading(false)}
 }

 return <div className="clickPayBox">
  <div className="clickPayHead">
   <div><small>💳 Etapa 8</small><strong>Condição real de pagamento</strong></div>
   <span>{priceLabel}</span>
  </div>

  <div className="clickPayPlans" role="group" aria-label="Plano de crediário">
   <button type="button" className={plan==="48"?"active":""} onClick={()=>{setPlan("48");if(installments<2)setInstallments(2);if(installments>24)setInstallments(24)}}>Cliente novo · 48 com entrada</button>
   <button type="button" className={plan==="CT1"?"active":""} onClick={()=>{setPlan("CT1");if(installments>24)setInstallments(24)}}>CT1 · sem entrada</button>
   <button type="button" className={plan==="CT2"?"active":""} onClick={()=>{setPlan("CT2");if(installments<2)setInstallments(2);if(installments>24)setInstallments(24)}}>CT2 · com entrada</button>
  </div>

  <div className="clickPayFields">
   <label>{plan==="CT1"?"Parcelas":"Pagamentos totais"}
    <select value={installments} onChange={e=>setInstallments(Number(e.target.value))}>
     {installmentChoices.filter(n=>plan==="CT1"?n<=24:n>=2&&n<=24).map(n=><option key={n} value={n}>{plan!=="CT1"?`${n} (entrada + ${n-1}x)`: `${n}x`}</option>)}
    </select>
   </label>
   {(plan==="CT2"||plan==="48")&&<label>Entrada
    <input value={entry} onChange={e=>setEntry(e.target.value)} inputMode="decimal" placeholder="Ex.: 100,00"/>
   </label>}
   {product.voltageOptions?.length?<label>Voltagem
    <select value={voltage} onChange={e=>setVoltage(e.target.value)}>
     <option value="">Escolher depois</option>
     {product.voltageOptions.map(v=><option key={v} value={v.replace(/[^0-9]/g,"")}>{v}</option>)}
    </select>
   </label>:null}
   <label>Garantia
    <select value={warranty?"sim":"nao"} onChange={e=>setWarranty(e.target.value==="sim")}>
     <option value="nao">Sem adicional</option><option value="sim">Com garantia</option>
    </select>
   </label>
   <label className="clickPayCpf">CPF do cliente
    <input value={cpf} onChange={e=>setCpf(e.target.value)} inputMode="numeric" autoComplete="off" placeholder="Somente para consultar"/>
   </label>
  </div>

  <button type="button" className="primary clickPayAction" onClick={simulate} disabled={loading}>{loading?"Consultando Plataforma Click...":"Simular esta condição"}</button>

  {error&&<div className="clickPayError">{error}</div>}
  {result&&result.ok&&<div className="clickPayResult">
   <div><small>Plano</small><strong>{result.plan}</strong></div>
   <div><small>Entrada</small><strong>{money(result.entry)}</strong></div>
   <div><small>{result.plan==="CT1"?"Parcelas":"Composição"}</small><strong>{result.plan!=="CT1"?`1 entrada + ${result.installments} parcelas`:`${result.installments}x`}</strong></div>
   <div><small>Valor da parcela</small><strong>{money(result.installmentValue)}</strong></div>
   <div><small>Total</small><strong>{money(result.total)}</strong></div>
   {result.financedTotal!==undefined?<div><small>Total parcelado</small><strong>{money(result.financedTotal)}</strong></div>:null}
   {(result.requiredProducts||result.ct1RequiredProducts)?.length?<p>Produtos obrigatórios preparados: {(result.requiredProducts||result.ct1RequiredProducts)!.map(item=>`${item.code} (${item.quantity}x)`).join(" • ")}</p>:null}
   {result.warranty?.message?<p>{result.warranty.message}{result.warranty.cartTotalAfterWarranty!==undefined?` Total do carrinho nesse momento: ${money(result.warranty.cartTotalAfterWarranty)}.`:""}</p>:null}
   <p>{result.safeStop||"Simulação concluída sem confirmar compra."}</p>
  </div>}
  <small className="clickPaySafety">🔒 O CPF é enviado apenas ao backend para a consulta. O XVendas não o grava neste painel nem executa confirmação de compra.</small>
 </div>
}
