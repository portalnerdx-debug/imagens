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

async function chooseVoltageIfRequested(page:Page,voltage?:string){
  const confirmationModal=page.locator("#ModalConfirmacao").first();
  if(await confirmationModal.isVisible({timeout:2500}).catch(()=>false)){
    if(!voltage)throw new Error("CARD_VOLTAGE_REQUIRED");
    const rx=voltage==="110"?/110\s*v|127\s*v/i:/220\s*v/i;
    const option=confirmationModal.getByRole("link",{name:rx}).first();
    if(!await option.isVisible({timeout:2000}).catch(()=>false))throw new Error("CARD_VOLTAGE_OPTION_NOT_FOUND");
    await option.click();
    await page.waitForLoadState("domcontentloaded",{timeout:8000}).catch(()=>{});
    await page.waitForTimeout(350);
    return;
  }
  const asksVoltage=await pageContains(page,/110\s*v|127\s*v|220\s*v|voltagem/i);
  if(!asksVoltage)return;
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
  await page.goto(`${origin}/checkout_catalogo/carrinho-entrega.php?reload=sim`,{
    waitUntil:"domcontentloaded",timeout:60000
  });
  await page.waitForLoadState("networkidle",{timeout:8000}).catch(()=>{});
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

function parsePaymentRows(html:string){
  const rows:Array<{id?:string;details?:string;value?:number;form?:string;conveniada?:string}>=[];
  const rowRegex=/<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  for(const rowMatch of html.matchAll(rowRegex)){
    const row=rowMatch[1];
    if(!/remove-payment/i.test(row))continue;
    const id=row.match(/remove-payment[^>]*data-item=["'](\d+)["']/i)?.[1];
    const value=parseMoney(row.match(/class=["']valor["'][^>]*value=["']([^"']+)["']/i)?.[1]);
    const details=row.match(/class=["']col-detalhes["'][^>]*>([\s\S]*?)<\/td>/i)?.[1]
      ?.replace(/<[^>]+>/g," ").replace(/&nbsp;/gi," ").replace(/\s+/g," ").trim();
    const form=row.match(/class=["']change-payment["'][\s\S]*?<option[^>]*value=['"](\d+)['"][^>]*selected/i)?.[1];
    const conv=row.match(/class=["']selectinho2["'][\s\S]*?<option[^>]*value=['"](\d+)['"][^>]*selected/i)?.[1];
    rows.push({id,details,value,form,conveniada:conv});
  }
  return rows;
}

function parseCardDetails(html:string){
  const rows=parsePaymentRows(html);
  const parcelRow=rows.find(r=>/\d+\s*x\s*(?:R\$)?\s*[\d.,]+/i.test(r.details||"") && !/1x\s*(?:R\$)?\s*0?[,\.]01\b/i.test(r.details||""));
  const detail=parcelRow?.details||"";
  const match=detail.match(/(\d+)\s*x\s*(?:R\$)?\s*([\d.,]+)/i);
  const installmentValue=parseMoney(match?.[2]);
  const totalMatch=html.match(/class=["'][^"']*valor-total[^"']*["'][^>]*>\s*(?:Total(?:\s+entrada)?\s*)?R\$?\s*([\d.,]+)/i);
  const total=parseMoney(totalMatch?.[1]);
  const entryRow=rows.find(r=>r.id && /1x\s*(?:R\$)?\s*[\d.,]+/i.test(r.details||""));
  return {
    installmentValue,total,details:detail,
    entry:entryRow?.value,entryPaymentId:entryRow?.id,
    parcelPaymentId:parcelRow?.id,
    mastercardSelected:/<option[^>]*value=['"]3['"][^>]*selected/i.test(html)
  };
}

async function configureCCSPayment(page:Page,installments:number){
  if(!Number.isInteger(installments)||installments<1||installments>24)throw new Error("CARD_INSTALLMENTS_OUT_OF_RANGE");
  const origin=new URL(page.url()).origin;
  const endpoint=`${origin}/checkout_catalogo/processa_inclui_pagamento_ajax.php`;
  const result=await page.evaluate(async({endpoint,installments})=>{
    const url=new URL(endpoint,window.location.href);
    url.searchParams.set("cod_pagto","CCS");
    url.searchParams.set("qt_parcelas",String(installments));
    url.searchParams.set("ajax","1");
    url.searchParams.set("_",String(Date.now()));
    const response=await fetch(url.toString(),{credentials:"include",cache:"no-store",headers:{"Accept":"application/json, text/javascript, */*; q=0.01","X-Requested-With":"XMLHttpRequest"}});
    return {ok:response.ok,text:await response.text()};
  },{endpoint,installments});
  if(!result.ok)throw new Error("CARD_PAYMENT_SETUP_FAILED");
  let html="";
  try{const payload=JSON.parse(result.text);html=typeof payload?.html==="string"?payload.html:result.text;}catch{html=result.text;}
  let parsed=parseCardDetails(html);
  if(parsed.installmentValue===undefined){
    await page.goto(`${origin}/checkout_catalogo/carrinho-entrega.php?reload=sim`,{waitUntil:"domcontentloaded",timeout:60000});
    await page.waitForLoadState("networkidle",{timeout:8000}).catch(()=>{});
    parsed=parseCardDetails(await page.content());
  }
  if(parsed.installmentValue===undefined)throw new Error("CARD_RESULT_NOT_PARSED");
  return parsed;
}

async function activateVariableEntry(page:Page){
  const origin=new URL(page.url()).origin;
  const result=await page.evaluate(async({origin})=>{
    const url=new URL("/checkout_catalogo/processa_entrada_variavel_calc_ajax.php",origin);
    url.searchParams.set("cod_pagto","CCC");
    url.searchParams.set("_",String(Date.now()));
    const response=await fetch(url.toString(),{credentials:"include",cache:"no-store",headers:{"Accept":"application/json, text/javascript, */*; q=0.01","X-Requested-With":"XMLHttpRequest"}});
    return {ok:response.ok,text:await response.text()};
  },{origin});
  if(!result.ok)throw new Error("CARD_VARIABLE_ENTRY_FAILED");
  try{return JSON.parse(result.text);}catch{return result.text;}
}

async function includePayment2(page:Page,params:Record<string,string>){
  const origin=new URL(page.url()).origin;
  return page.evaluate(async({origin,params})=>{
    const url=new URL("/checkout_catalogo/processa_inclui_pagamento2_ajax.php",origin);
    Object.entries(params).forEach(([k,v])=>url.searchParams.set(k,v));
    const response=await fetch(url.toString(),{credentials:"include",cache:"no-store",headers:{"Accept":"application/json, text/javascript, */*; q=0.01","X-Requested-With":"XMLHttpRequest"}});
    return {ok:response.ok,status:response.status,text:await response.text()};
  },{origin,params});
}

async function blockEntryEditing(page:Page){
  const origin=new URL(page.url()).origin;
  await page.evaluate(async({origin})=>{
    const url=new URL("/checkout_catalogo/processa_liberar_entradas_ajax.php",origin);
    url.searchParams.set("acao","bloquear_entradas");
    url.searchParams.set("prevent_cache",String(Date.now()));
    url.searchParams.set("_",String(Date.now()));
    await fetch(url.toString(),{credentials:"include",cache:"no-store",headers:{"X-Requested-With":"XMLHttpRequest"}});
  },{origin});
}

async function configureCCCWithEntry(page:Page,installments:number,entry:number){
  if(!Number.isInteger(installments)||installments<2||installments>24)throw new Error("CARD_INSTALLMENTS_OUT_OF_RANGE");
  if(!(entry>0))throw new Error("CARD_ENTRY_REQUIRED");
  const origin=new URL(page.url()).origin;
  const setup=await page.evaluate(async({origin,installments})=>{
    const url=new URL("/checkout_catalogo/processa_inclui_pagamento_ajax.php",origin);
    url.searchParams.set("cod_pagto","CCC");url.searchParams.set("qt_parcelas",String(installments));url.searchParams.set("ajax","1");url.searchParams.set("_",String(Date.now()));
    const response=await fetch(url.toString(),{credentials:"include",cache:"no-store",headers:{"Accept":"application/json, text/javascript, */*; q=0.01","X-Requested-With":"XMLHttpRequest"}});
    return {ok:response.ok,text:await response.text()};
  },{origin,installments});
  if(!setup.ok)throw new Error("CARD_PAYMENT_SETUP_FAILED");
  await activateVariableEntry(page);
  await page.goto(`${origin}/checkout_catalogo/carrinho-entrega.php?reload=sim`,{waitUntil:"domcontentloaded",timeout:60000});
  await page.waitForLoadState("networkidle",{timeout:8000}).catch(()=>{});

  let state=parseCardDetails(await page.content());
  if(!state.entryPaymentId||!state.parcelPaymentId){
    await activateVariableEntry(page);
    await page.goto(`${origin}/checkout_catalogo/carrinho-entrega.php?reload=sim`,{waitUntil:"domcontentloaded",timeout:60000});
    await page.waitForLoadState("networkidle",{timeout:8000}).catch(()=>{});
    state=parseCardDetails(await page.content());
  }
  if(!state.entryPaymentId||!state.parcelPaymentId)throw new Error("CARD_PAYMENT_ID_NOT_FOUND");

  const entryValue=entry.toFixed(2).replace(".",",");
  const entryResult=await includePayment2(page,{cod_pagto:"CCC",cd_pagamento:state.entryPaymentId,cod_formpagto:"1",tipo_pagto:"P",valor_pagamento:entryValue,_:String(Date.now())});
  if(!entryResult.ok)throw new Error("CARD_ENTRY_PAYMENT_FAILED");
  await blockEntryEditing(page);

  await page.goto(`${origin}/checkout_catalogo/carrinho-entrega.php?reload=sim`,{waitUntil:"domcontentloaded",timeout:60000});
  await page.waitForLoadState("networkidle",{timeout:8000}).catch(()=>{});
  state=parseCardDetails(await page.content());
  const parcelId=state.parcelPaymentId;
  if(!parcelId)throw new Error("CARD_PAYMENT_ID_NOT_FOUND");

  const htmlAfterEntry=await page.content();
  const parcelBase=parseMoney(htmlAfterEntry.match(/id=["']valor_parc\[\]["'][^>]*value=["']([^"']+)["']/i)?.[1]);
  const financedAmount=parcelBase ?? Math.max(0,(state.total||0)-entry);
  const parcelResult=await includePayment2(page,{cod_pagto:"CCC",cd_pagamento:parcelId,cod_formpagto:"200",valor_pagamento:financedAmount.toFixed(2).replace(".",","),_:String(Date.now())});
  if(!parcelResult.ok)throw new Error("CARD_INSTALLMENT_PAYMENT_FAILED");

  // 3 = MASTERCARD. A Click pode retornar texto de erro nesta chamada, mas o HAR
  // mostra que a seleção é refletida no carrinho; a validação final é feita pelo HTML.
  await page.evaluate(async({origin,parcelId})=>{
    const url=new URL("/checkout_catalogo/processa_conveniada_ajax.php",origin);
    url.searchParams.set("cd_conveniada","3");url.searchParams.set("cd_pagamento",parcelId);url.searchParams.set("prevent_cache",new Date().toString());url.searchParams.set("_",String(Date.now()));
    await fetch(url.toString(),{credentials:"include",cache:"no-store",headers:{"X-Requested-With":"XMLHttpRequest"}});
  },{origin,parcelId});

  await page.goto(`${origin}/checkout_catalogo/carrinho-entrega.php?reload=sim`,{waitUntil:"domcontentloaded",timeout:60000});
  await page.waitForLoadState("networkidle",{timeout:8000}).catch(()=>{});
  const final=parseCardDetails(await page.content());
  if(final.installmentValue===undefined)throw new Error("CARD_RESULT_NOT_PARSED");
  return {...final,entry,cardForm:"200 - T CREDITO",brand:"MASTERCARD",plan:"CCC" as const};
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
