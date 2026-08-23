import type {Page} from "playwright";
import {CLICK_DEFAULT_CPF} from "./config.js";
import {clickText,pageContains} from "./flowHelpers.js";
import {searchProduct} from "./productSearch.js";

export type CardPlan="CCS"|"CCC";

export interface CardRequest{
  code:string;
  plan:CardPlan;
  installments:number;
  entry?:number;
  cpf?:string;
  voltage?:string;
}

type PaymentState={
  entryPaymentId?:string;
  parcelPaymentId?:string;
  entry?:number;
  parcelTotal?:number;
  installmentValue?:number;
  parcelForm?:string;
  conveniada?:string;
};

async function chooseVoltageIfRequested(page:Page,voltage?:string){
  const modal=page.locator("#ModalConfirmacao").first();
  if(await modal.isVisible({timeout:2500}).catch(()=>false)){
    if(!voltage)throw new Error("CARD_VOLTAGE_REQUIRED");
    const rx=voltage==="110"?/110\s*v|127\s*v/i:/220\s*v/i;
    const option=modal.getByRole("link",{name:rx}).first();
    if(!await option.isVisible({timeout:2000}).catch(()=>false))throw new Error("CARD_VOLTAGE_OPTION_NOT_FOUND");
    await option.click();
    await page.waitForLoadState("domcontentloaded",{timeout:8000}).catch(()=>{});
    await page.waitForTimeout(350);
    return;
  }
  const asks=await pageContains(page,/110\s*v|127\s*v|220\s*v|voltagem/i);
  if(!asks)return;
  if(!voltage)throw new Error("CARD_VOLTAGE_REQUIRED");
  const rx=voltage==="110"?/110\s*v|127\s*v/i:/220\s*v/i;
  if(!await clickText(page,[rx]))throw new Error("CARD_VOLTAGE_OPTION_NOT_FOUND");
  await page.waitForTimeout(350);
}

async function enterCpf(page:Page,cpf:string){
  const origin=new URL(page.url()).origin;
  const response=await page.request.post(`${origin}/checkout_catalogo/processa_loginc.php`,{
    params:{tp_pessoa:"PF"},
    form:{nr_documento:cpf},
    headers:{referer:page.url(),origin},
    timeout:60000
  });
  if(!response.ok())throw new Error("CARD_CPF_SUBMIT_FAILED");
  await reloadCart(page);
}

async function includeProductWithoutWarranty(page:Page,code:string){
  const origin=new URL(page.url()).origin;
  const url=new URL("/checkout_catalogo/carrinho.php",origin);
  url.searchParams.set("cod",code);
  url.searchParams.set("acao","incluir");
  url.searchParams.set("op_garantia","0");
  await page.goto(url.toString(),{waitUntil:"domcontentloaded",timeout:60000});
  await page.waitForLoadState("networkidle",{timeout:8000}).catch(()=>{});
}

function parseMoney(value:string|undefined){
  if(!value)return undefined;
  const n=Number(value.replace(/\./g,"").replace(",","."));
  return Number.isFinite(n)?n:undefined;
}

async function readPaymentState(page:Page):Promise<PaymentState>{
  return page.evaluate(()=>{
    const readRows=(selector:string)=>Array.from(document.querySelectorAll(`${selector} .tbodyajax tr`)).map((row:any)=>{
      const remove=row.querySelector(".remove-payment[data-item]");
      const form=row.querySelector("select.change-payment");
      const conv=row.querySelector("select.selectinho2");
      const detail=String(row.querySelector(".col-detalhes")?.textContent||"").replace(/\s+/g," ").trim();
      const input=row.querySelector("input.valor");
      const rawValue=input?.value||"";
      const value=rawValue?Number(String(rawValue).replace(/\./g,"").replace(",",".")):undefined;
      return {
        id:remove?.getAttribute("data-item")||form?.getAttribute("data-cdpagamento")||undefined,
        type:remove?.getAttribute("data-type")||undefined,
        form:form?.value||undefined,
        conv:conv?.value||undefined,
        detail,
        value
      };
    });
    const entries=readRows("#pagamentos_ent");
    const parcels=readRows("#pagamentos_parc");
    const entry=entries.find(r=>r.type==="E")||entries[0];
    const parcel=parcels.find(r=>r.type==="P"&&r.form==="200")||parcels.find(r=>r.type==="P")||parcels[0];
    const match=String(parcel?.detail||"").match(/(\d+)\s*x\s*(?:R\$)?\s*([\d.,]+)/i);
    const installmentValue=match?Number(match[2].replace(/\./g,"").replace(",",".")):undefined;
    return {
      entryPaymentId:entry?.id,
      parcelPaymentId:parcel?.id,
      entry:entry?.value,
      parcelTotal:parcel?.value,
      installmentValue,
      parcelForm:parcel?.form,
      conveniada:parcel?.conv
    };
  }).catch(()=>({} as PaymentState));
}

async function setupPayment(page:Page,plan:CardPlan,qtParcelas:number){
  const origin=new URL(page.url()).origin;
  const response=await page.request.get(`${origin}/checkout_catalogo/processa_inclui_pagamento_ajax.php`,{
    params:{cod_pagto:plan,qt_parcelas:String(qtParcelas),ajax:"1",_:String(Date.now())},
    headers:{referer:page.url(),"x-requested-with":"XMLHttpRequest"},timeout:60000
  });
  if(!response.ok())throw new Error("CARD_PAYMENT_SETUP_FAILED");
  return response.text();
}

async function setupVariableEntry(page:Page){
  const origin=new URL(page.url()).origin;
  const response=await page.request.get(`${origin}/checkout_catalogo/processa_entrada_variavel_calc_ajax.php`,{
    params:{cod_pagto:"CCC",_:String(Date.now())},
    headers:{referer:page.url(),"x-requested-with":"XMLHttpRequest"},timeout:60000
  });
  if(!response.ok())throw new Error("CARD_VARIABLE_ENTRY_FAILED");
  return response.text();
}

async function setVariableEntry(page:Page,paymentId:string,entry:number){
  const origin=new URL(page.url()).origin;
  const response=await page.request.get(`${origin}/checkout_catalogo/processa_inclui_pagamento_variavel_ajax.php`,{
    params:{cd_pagamento:paymentId,valor:String(entry),_:String(Date.now())},
    headers:{referer:page.url(),"x-requested-with":"XMLHttpRequest"},timeout:60000
  });
  if(!response.ok())throw new Error("CARD_ENTRY_PAYMENT_FAILED");
  const text=await response.text();
  try{
    const payload=JSON.parse(text);
    if(payload?.ok===false)throw new Error("CARD_ENTRY_PAYMENT_FAILED");
  }catch(error){
    if(error instanceof Error&&error.message==="CARD_ENTRY_PAYMENT_FAILED")throw error;
  }
}

async function setPaymentForm(page:Page,params:Record<string,string>){
  const origin=new URL(page.url()).origin;
  const response=await page.request.get(`${origin}/checkout_catalogo/processa_inclui_pagamento2_ajax.php`,{
    params,headers:{referer:page.url(),"x-requested-with":"XMLHttpRequest"},timeout:60000
  });
  if(!response.ok())throw new Error("CARD_INSTALLMENT_PAYMENT_FAILED");
  return response.text();
}

async function setMastercard(page:Page,paymentId:string){
  const origin=new URL(page.url()).origin;
  const response=await page.request.get(`${origin}/checkout_catalogo/processa_conveniada_ajax.php`,{
    params:{cd_conveniada:"3",cd_pagamento:paymentId,prevent_cache:new Date().toString(),_:String(Date.now())},
    headers:{referer:page.url(),"x-requested-with":"XMLHttpRequest"},timeout:60000
  });
  // A Click pode responder "Unknown column 'CCC'" mesmo persistindo a seleção;
  // a validação é feita na página recarregada, como no HAR real.
  if(!response.ok())throw new Error("CARD_INSTALLMENT_PAYMENT_FAILED");
  return response.text();
}

async function reloadCart(page:Page){
  const origin=new URL(page.url()).origin;
  await page.goto(`${origin}/checkout_catalogo/carrinho-entrega.php?reload=sim`,{waitUntil:"domcontentloaded",timeout:60000});
  await page.waitForLoadState("networkidle",{timeout:8000}).catch(()=>{});
}

async function configureCCSPayment(page:Page,installments:number){
  if(!Number.isInteger(installments)||installments<1||installments>24)throw new Error("CARD_INSTALLMENTS_OUT_OF_RANGE");
  await setupPayment(page,"CCS",installments);
  await reloadCart(page);
  const state=await readPaymentState(page);
  if(state.installmentValue===undefined)throw new Error("CARD_RESULT_NOT_PARSED");
  return {installmentValue:state.installmentValue,total:state.parcelTotal};
}

async function configureCCCWithEntry(page:Page,installments:number,entry:number){
  if(!Number.isInteger(installments)||installments<1||installments>24)throw new Error("CARD_INSTALLMENTS_OUT_OF_RANGE");
  if(!(entry>0))throw new Error("CARD_ENTRY_REQUIRED");

  // No CCC, a Click conta a entrada dentro de qt_parcelas.
  const totalPayments=installments+1;
  const setupText=await setupPayment(page,"CCC",totalPayments);
  let setupHtml=setupText;
  try{setupHtml=JSON.parse(setupText)?.html||setupText}catch{}
  const setupEntryId=setupHtml.match(/data-item=["'](\d+)["']/i)?.[1];

  await setupVariableEntry(page);
  await reloadCart(page);
  let state=await readPaymentState(page);
  const entryId=state.entryPaymentId||setupEntryId;
  if(!entryId)throw new Error("CARD_PAYMENT_ID_NOT_FOUND");

  await setVariableEntry(page,entryId,entry);
  await reloadCart(page);
  state=await readPaymentState(page);
  const parcelId=state.parcelPaymentId;
  if(!parcelId)throw new Error("CARD_PAYMENT_ID_NOT_FOUND");

  const parcelTotal=state.parcelTotal;
  if(parcelTotal===undefined)throw new Error("CARD_RESULT_NOT_PARSED");

  await setPaymentForm(page,{
    cod_pagto:"CCC",
    cd_pagamento:parcelId,
    cod_formpagto:"200",
    valor_pagamento:parcelTotal.toFixed(2).replace(".",","),
    _:String(Date.now())
  });

  await reloadCart(page);
  state=await readPaymentState(page);
  if(state.parcelPaymentId!==parcelId||state.parcelForm!=="200"){
    throw new Error("CARD_PAYMENT_ID_NOT_FOUND");
  }

  // A seleção de Mastercard pode retornar texto de erro na Click, mas o HTML final
  // é a fonte de verdade: o HAR mostra a opção 3 marcada após o reload.
  await setMastercard(page,parcelId);
  await reloadCart(page);
  state=await readPaymentState(page);

  let masterOk=false;
  for(let attempt=0;attempt<4;attempt++){
    masterOk=await page.locator('#pagamentos_parc .selectinho2').evaluate((el:any)=>String(el.value)==="3").catch(()=>false);
    if(masterOk&&state.parcelPaymentId===parcelId&&state.parcelForm==="200"&&state.installmentValue!==undefined)break;
    await page.waitForTimeout(500);
    await reloadCart(page);
    state=await readPaymentState(page);
  }

  if(!masterOk||state.parcelPaymentId!==parcelId||state.parcelForm!=="200"||state.installmentValue===undefined){
    throw new Error("CARD_PAYMENT_ID_NOT_FOUND");
  }

  return {
    installmentValue:state.installmentValue,
    total:(state.entry??entry)+(state.parcelTotal??parcelTotal),
    entry,
    cardForm:"200 - T CREDITO",
    brand:"MASTERCARD"
  };
}

export async function simulateCard(page:Page,req:CardRequest){
  if(!req.code)throw new Error("PRODUCT_CODE_REQUIRED");
  if(req.plan!=="CCS"&&req.plan!=="CCC")throw new Error("CARD_PLAN_REQUIRED");
  if(!Number.isInteger(req.installments)||req.installments<1||req.installments>24)throw new Error("CARD_INSTALLMENTS_OUT_OF_RANGE");
  const cpf=(req.cpf||CLICK_DEFAULT_CPF).replace(/\D/g,"");
  if(cpf.length!==11)throw new Error("CPF_REQUIRED");

  const product=await searchProduct(page,req.code);
  if(!product.found)throw new Error("PRODUCT_NOT_FOUND");
  const codeMatch=page.getByText(req.code,{exact:false}).first();
  if(await codeMatch.isVisible({timeout:1800}).catch(()=>false))await codeMatch.click();
  await page.waitForTimeout(450);
  if(!await clickText(page,[/^comprar$/i,/adicionar.*carrinho/i,/selecionar/i]))throw new Error("BUY_ACTION_NOT_FOUND");
  await page.waitForTimeout(650);
  await chooseVoltageIfRequested(page,req.voltage);
  await includeProductWithoutWarranty(page,req.code);
  await enterCpf(page,cpf);

  if(req.plan==="CCS"){
    const payment=await configureCCSPayment(page,req.installments);
    return {ok:true,productCode:req.code,plan:"CCS" as const,installments:req.installments,installmentValue:payment.installmentValue,total:payment.total,voltage:req.voltage||undefined,status:"CARD_CREDIT_SIMULATED",message:"Cartão de crédito sem entrada (CCS) consultado na Plataforma Click. Nenhuma compra foi confirmada.",safeStop:"Simulação de cartão CCS concluída. Nenhuma compra ou pedido foi confirmado.",product};
  }

  const payment=await configureCCCWithEntry(page,req.installments,Number(req.entry||0));
  return {ok:true,productCode:req.code,plan:"CCC" as const,installments:req.installments,entry:payment.entry,installmentValue:payment.installmentValue,total:payment.total,voltage:req.voltage||undefined,cardForm:payment.cardForm,brand:payment.brand,status:"CARD_CREDIT_WITH_ENTRY_SIMULATED",message:"Cartão de crédito com entrada (CCC) consultado com dinheiro na entrada, T CREDITO nas parcelas e MASTERCARD na bandeira.",safeStop:"Simulação de cartão CCC concluída. Nenhuma compra ou pedido foi confirmado.",product};
}