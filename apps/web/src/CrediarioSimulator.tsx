import React,{useMemo,useState} from "react";
import {useLiveProducts} from "./LiveProductContext";
import {lookupClickProduct,simulateClickCredit} from "./ClickGateway";

export type CreditPlan="48"|"CT1"|"CT2";

function entryNumber(value:string){
 const parsed=Number(value.replace(/\./g,"").replace(",",".").replace(/[^\d.-]/g,""));
 return Number.isFinite(parsed)?parsed:0;
}

function friendlyError(e:any){
 const raw=String(e?.message||e||"");
 if(raw.includes("CLICK_CREDENTIALS_NOT_CONFIGURED"))return "As credenciais da Plataforma Click não estão configuradas no Render.";
 if(raw.includes("CLICK_INTERACTIVE_CHALLENGE_REQUIRED"))return "A Plataforma Click pediu uma verificação interativa e não permitiu renovar a sessão automaticamente.";
 if(raw.includes("CLICK_LOGIN_FAILED"))return "O Render tentou renovar a sessão, mas a Plataforma Click não aceitou o login.";
 if(raw.includes("CLICK_SESSION_EXPIRED"))return "A sessão da Plataforma Click expirou e não pôde ser renovada automaticamente.";
 if(raw.includes("failed-precondition"))return "A integração autorizada com a Plataforma Click ainda não foi configurada no servidor.";
 if(raw.includes("unauthenticated")||raw.includes("Faça login"))return "Faça login no XVendas para consultar o crediário.";
 if(raw.includes("PRODUCT_NOT_FOUND"))return "Produto não encontrado na Plataforma Click.";
 if(raw.includes("CT1_INSTALLMENTS_OUT_OF_RANGE"))return "O tradicional sem entrada (CT1) permite de 1 a 24 parcelas.";
 if(raw.includes("CREDIT_RESULT_NOT_PARSED"))return "A Plataforma Click abriu o crediário, mas o valor da parcela não foi identificado. Tente novamente.";
 if(raw.includes("CREDIT_REQUEST_FAILED"))return "A Plataforma Click não concluiu a consulta CT1. Tente novamente.";
 if(raw.includes("CT1_PRODUCT_PRICE_REQUIRED"))return "O preço do produto precisa ser confirmado antes de preparar o CT1.";
 if(raw.includes("CT1_CART_PREPARATION_FAILED"))return "Não foi possível preparar os produtos obrigatórios do CT1.";
 if(raw.includes("TRADITIONAL_PRODUCT_PRICE_REQUIRED"))return "Confirme o preço do produto antes de preparar o crediário tradicional.";
 if(raw.includes("TRADITIONAL_CART_PREPARATION_FAILED"))return "Não foi possível preparar os produtos obrigatórios do crediário tradicional.";
 if(raw.includes("WARRANTY_OPTION_NOT_FOUND"))return "A tela de garantia abriu, mas a opção escolhida não foi localizada.";
 if(raw.includes("CPF_SUBMIT_FAILED"))return "A Plataforma Click não aceitou o envio do CPF para abrir as condições CT1.";
 if(raw.includes("WARRANTY_SERVICE_FAILED"))return "A garantia não foi confirmada no carrinho da Plataforma Click.";
 if(raw.includes("CT2_INSTALLMENTS_OUT_OF_RANGE"))return "No CT2, informe de 2 a 24 pagamentos totais (entrada + parcelas).";
 if(raw.includes("CT2_PAYMENT_SETUP_FAILED"))return "A Plataforma Click não conseguiu abrir a condição CT2.";
 if(raw.includes("CT2_VARIABLE_ENTRY_FAILED"))return "A Plataforma Click não conseguiu atualizar a entrada variável do CT2.";
 if(raw.includes("CT2_PAYMENT_ID_NOT_FOUND"))return "A linha de entrada variável do CT2 não foi identificada.";
 if(raw.includes("CT2_ENTRY_BELOW_MINIMUM"))return "A entrada informada é menor que o mínimo calculado pela Plataforma Click.";
 if(raw.includes("48_INSTALLMENTS_OUT_OF_RANGE"))return "No Cliente Novo 48, informe de 2 a 24 pagamentos totais (entrada + parcelas).";
 if(raw.includes("48_PAYMENT_SETUP_FAILED"))return "A Plataforma Click não conseguiu abrir a condição Cliente Novo 48.";
 if(raw.includes("48_VARIABLE_ENTRY_FAILED"))return "A Plataforma Click não conseguiu atualizar a entrada variável do Cliente Novo 48.";
 if(raw.includes("48_PAYMENT_ID_NOT_FOUND"))return "A linha de entrada variável do Cliente Novo 48 não foi identificada.";
 if(raw.includes("48_ENTRY_BELOW_MINIMUM"))return "A entrada informada é menor que o mínimo calculado pela Plataforma Click.";
 if(raw.includes("NEW_CUSTOMER_CART_CLEANUP_FAILED"))return "Não foi possível retirar o produto tradicional 447164 do carrinho Cliente Novo.";
 if(raw.includes("CART_CLEANUP_FAILED"))return "Não foi possível zerar o carrinho da Plataforma Click. Tente novamente antes de fazer outra simulação.";
 if(raw.includes("TRADITIONAL_CART_TOTAL_REQUIRED"))return "Não foi possível obter o total do carrinho antes de selecionar a faixa do seguro prestamista.";
 if(raw.includes("PRESTAMISTA_BAND_SETUP_FAILED"))return "Não foi possível manter somente o produto de seguro correspondente à faixa do total.";
 if(raw.includes("invalid-argument"))return "Revise CPF, parcelas, plano e entrada.";
 return raw&&raw!=="AUTOMATION_FAILED"?raw:"Não foi possível consultar o crediário agora.";
}
export function CrediarioSimulator(){
 const {products,addProduct}=useLiveProducts();
 const [code,setCode]=useState(""),[plan,setPlan]=useState<CreditPlan>("48");
 const [installments,setInstallments]=useState(10),[entry,setEntry]=useState("");
 const [voltage,setVoltage]=useState(""),[warranty,setWarranty]=useState(false);
 const [cpf,setCpf]=useState(""),[loading,setLoading]=useState(false),[searching,setSearching]=useState(false);
 const [error,setError]=useState(""),[result,setResult]=useState<any>(null),[loadedProduct,setLoadedProduct]=useState<any>(null);
 const cachedProduct=useMemo(()=>products.find(p=>p.code===code.trim()),[products,code]);
 const product=loadedProduct?.code===code.trim()?loadedProduct:cachedProduct;

 async function searchByCode(){
  const clean=code.trim();
  setError("");setResult(null);
  if(!clean){setError("Digite o código do produto.");return null}
  setSearching(true);
  try{
   const p=await lookupClickProduct(clean);
   if(!p.found){setError("Produto não encontrado na Plataforma Click.");return null}
   setLoadedProduct(p);addProduct(p as any);
   const opts=p.voltageOptions||[];
   if(!voltage&&opts.length===1){
    const v=opts[0].match(/110|127|220/)?.[0];
    if(v)setVoltage(v==="127"?"110":v);
   }
   return p;
  }catch(e){setError(friendlyError(e));return null}
  finally{setSearching(false)}
 }

 async function simulate(){
  setError("");setResult(null);
  const cleanCode=code.trim();
  if(!cleanCode){setError("Digite o código do produto.");return}
  const cleanCpf=cpf.replace(/\D/g,"");
  if(cleanCpf.length!==11){setError("Digite um CPF com 11 números.");return}
  if((plan==="CT2"||plan==="48")&&!(entryNumber(entry)>0)){setError(`${plan} exige uma entrada maior que zero.`);return}
  setLoading(true);
  try{
   // O produto não precisa mais ter sido pesquisado em outro módulo. O próprio
   // crediário valida o código na Plataforma Click antes de iniciar a simulação.
   let p=product;
   if(!p){
    p=await lookupClickProduct(cleanCode);
    if(!p.found)throw new Error("PRODUCT_NOT_FOUND");
    setLoadedProduct(p);addProduct(p as any);
   }
   const data=await simulateClickCredit({
    productCode:cleanCode,plan,installments,
    ...(plan==="CT2"||plan==="48"?{entry:entryNumber(entry)}:{}),
    ...(voltage?{voltage}:{}),warranty,cpf:cleanCpf
   });
   setResult(data);
  }catch(e){setError(friendlyError(e))}
  finally{setLoading(false)}
 }
 return <section className="creditSimulator">
  <div className="creditHead"><div><span className="step">💳 Crediário</span><h3>Consultar pelo código do produto</h3></div><span>48 • CT1 • CT2</span></div>
  <div className="creditGrid">
   <label className="cpfField">Código do produto
    <div className="creditCodeRow"><input value={code} onChange={e=>{setCode(e.target.value);setLoadedProduct(null)}} inputMode="numeric" placeholder="Ex.: 412100"/><button type="button" onClick={searchByCode} disabled={searching}>{searching?"Buscando...":"Buscar código"}</button></div>
   </label>
   <label>Plano<select value={plan} onChange={e=>{const next=e.target.value as CreditPlan;setPlan(next);if(installments>24)setInstallments(24);if((next==="48"||next==="CT2")&&installments<2)setInstallments(2)}}><option value="48">Cliente Novo — código 48 com entrada</option><option value="CT1">Tradicional — CT1 sem entrada</option><option value="CT2">Tradicional — CT2 com entrada</option></select></label>
   <label>{plan==="CT1"?"Parcelas":"Pagamentos totais (entrada + parcelas)"}<input type="number" min={plan==="CT1"?1:2} max={24} value={installments} onChange={e=>setInstallments(Number(e.target.value))}/></label>
   {(plan==="CT2"||plan==="48")&&<label>Entrada variável<input value={entry} onChange={e=>setEntry(e.target.value)} placeholder="R$ 0,00"/></label>}
   <label>Voltagem<select value={voltage} onChange={e=>setVoltage(e.target.value)}><option value="">Não se aplica / escolher depois</option><option value="110">110/127V</option><option value="220">220V</option></select></label>
   <label>Garantia<select value={warranty?"yes":"no"} onChange={e=>setWarranty(e.target.value==="yes")}><option value="no">Sem garantia adicional</option><option value="yes">Com garantia adicional</option></select></label>
   <label className="cpfField">CPF para consulta<input value={cpf} onChange={e=>setCpf(e.target.value)} inputMode="numeric" autoComplete="off" placeholder="Somente para a consulta"/></label>
  </div>
  {product&&<div className="creditProductFound"><strong>✓ {product.code}</strong><span>{product.name||"Produto localizado"}</span>{product.price!==undefined&&<b>R$ {Number(product.price).toFixed(2).replace(".",",")}</b>}</div>}
  <button className="primary creditAction" onClick={simulate} disabled={loading||searching}>{loading?"Consultando...":"Consultar crediário"}</button>
  {error&&<div className="creditError">{error}</div>}
  {result&&<div className="creditResult creditReceipt">
   <div><small>Plano</small><strong>{result.plan}</strong></div>
   <div><small>Entrada</small><strong>{result.entry!==undefined?`R$ ${Number(result.entry).toFixed(2).replace(".",",")}`:"—"}</strong></div>
   <div><small>{result.plan==="CT1"?"Parcelas":"Composição"}</small><strong>{result.plan!=="CT1"?`1 entrada + ${result.installments}x de R$ ${Number(result.installmentValue).toFixed(2).replace(".",",")}`:result.installmentValue!==undefined?`${result.installments}x de R$ ${Number(result.installmentValue).toFixed(2).replace(".",",")}`:`${result.installments}x — valor não capturado`}</strong></div>
   {result.financedTotal!==undefined&&<div><small>Total parcelado</small><strong>R$ {Number(result.financedTotal).toFixed(2).replace(".",",")}</strong></div>}
   <div><small>Total</small><strong>{result.total!==undefined?`R$ ${Number(result.total).toFixed(2).replace(".",",")}`:"—"}</strong></div>
   {(result.requiredProducts||result.ct1RequiredProducts)?.length>0&&<p>Produtos obrigatórios preparados: {(result.requiredProducts||result.ct1RequiredProducts).map((item:any)=>`${item.code} (${item.quantity}x)`).join(" • ")}</p>}
   {result.warranty?.message&&<p>{result.warranty.message}{result.warranty.cartTotalAfterWarranty!==undefined?` Total usado para escolher a faixa, sem o produto 849xxx: R$ ${Number(result.warranty.cartTotalAfterWarranty).toFixed(2).replace(".",",")}.`:""}</p>}
   {result.message&&<p>{result.message}</p>}
  </div>}
  <div className="creditSafety"><strong>🔒 CPF temporário</strong><span>É enviado à função segura somente para a consulta e não é incluído pelo XVendas no histórico de aprendizado.</span></div>
 </section>
}
