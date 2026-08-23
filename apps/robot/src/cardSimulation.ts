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
    params:{tp_pessoa:"PF"},form:{nr_documento:cpf},headers:{referer:page.url(),origin},timeout:60000
  });
  if(!response.ok())throw new Error("CARD_CPF_SUBMIT_FAILED");
  await page.goto(`${origin}/checkout_catalogo/carrinho-entrega.php?reload=sim`,{waitUntil:"domcontentloaded",timeout:60000});
  await page.waitForLoadState("networkidle",{timeout:8000}).catch(()=>{});
}

async function includeProductWithoutWarranty(page:Page,code:string){
  const origin=new URL(page.url()).origin;
  const url=new URL("/checkout_catalogo/carrinho.php",origin);
  url.searchParams.set("cod",code);url.searchParams.set("acao","incluir");url.searchParams.set("op_garantia","0");
  await page.goto(url.toString(),{waitUntil:"domcontentloaded",timeout:60000});
  await page.waitForLoadState("networkidle",{timeout:8000}).catch(()=>{});
}

function parseMoney(value:string|undefined){
  if(!value)return undefined;
  const n=Number(value.replace(/\./g,"").replace(",","."));
  return Number.isFinite(n)?n:undefined;
}

function cleanHtml(html:string){
  return html.replace(/\\"/g,'"').replace(/&nbsp;/gi," ");
}

function parsePaymentRows(html:string){
  const rows:Array<{id?:string;details?:string;value?:number;form?:string;conveniada?:string}>=[];
  for(const m of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)){
    const row=m[1];
    if(!/remove-payment/i.test(row))continue;
    const id=row.match(/remove-payment[\s\S]*?data-item=["'](\d+)["']/i)?.[1];
    if(!id)continue;
    const value=parseMoney(row.match(/class=["']valor["'][^>]*value=["']([^"']+)["']/i)?.[1]??row.match(/name=["']valor_(?:ent|parc)\[\]["'][^>]*value=["']([^"']+)["']/i)?.[1]);
    const details=row.match(/class=["']col-detalhes["'][^>]*>([\s\S]*?)<\/td>/i)?.[1]?.replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();
    const form=row.match(/class=["']change-payment["'][\s\S]*?<option[^>]*value=['"](\d+)['"][^>]*selected/i)?.[1]??row.match(/class=["']change-payment["'][\s\S]*?<option[^>]*selected[^>]*value=['"](\d+)['"]/i)?.[1];
    const conveniada=row.match(/class=["']selectinho2["'][\s\S]*?<option[^>]*value=['"](\d+)['"][^>]*selected/i)?.[1]??row.match(/class=["']selectinho2["'][\s\S]*?<option[^>]*selected[^>]*value=['"](\d+)['"]/i)?.[1];
    rows.push({id,details,value,form,conveniada});
  }
  return rows;
}

function parseCardDetails(html:string,plan:CardPlan){
  const source=cleanHtml(html);
  const rows=parsePaymentRows(source);
  const entryRow=rows.find(r=>r.form==="1"||/entrada/i.test(r.details||""));
  const parcelRow=rows.find(r=>r.form==="200")??rows.find(r=>plan==="CCC"&&r.conveniada==="3")??rows.find(r=>r.details&&/\d+\s*x\s*(?:R\$)?\s*[\d.,]+/i.test(r.details));
  const detail=parcelRow?.details||"";
  const match=detail.match(/(\d+)\s*x\s*(?:R\$)?\s*([\d.,]+)/i);
  const installmentValue=parseMoney(match?.[2]);
  const parcelTotal=parseMoney(source.match(/class=["'][^"']*valor-total[^"']*["'][^>]*>[\s\S]*?Total\s+Parcelas:\s*R\$?\s*([\d.,]+)/i)?.[1]);
  const genericTotal=parseMoney(source.match(/class=["'][^"']*valor-total[^"']*["'][^>]*>\s*(?:Total\s*)?R\$?\s*([\d.,]+)/i)?.[1]);
  const valueParc=parseMoney(source.match(/(?:id|name)=["']valor_parc\[\]["'][^>]*value=["']([^"']+)["']/i)?.[1]);
  const total=plan==="CCC"?(entryRow?.value??0)+(parcelTotal??valueParc??0):(genericTotal??parcelTotal);
  return {installmentValue,total:total||undefined,details:detail,entry:entryRow?.value,entryPaymentId:entryRow?.id,parcelPaymentId:parcelRow?.id,parcelPaymentForm:parcelRow?.form,conveniada:parcelRow?.conveniada,mastercardSelected:/<option[^>]*value=['"]3['"][^>]*selected/i.test(source)};
}

async function getText(page:Page,path:string,params:Record<string,string>){
  const origin=new URL(page.url()).origin;
  return page.evaluate(async({origin,path,params})=>{
    const url=new URL(path,origin);Object.entries(params).forEach(([k,v])=>url.searchParams.set(k,v));
    const response=await fetch(url.toString(),{credentials:"include",cache:"no-store",headers:{"Accept":"application/json, text/javascript, */*; q=0.01","X-Requested-With":"XMLHttpRequest"}});
    return {ok:response.ok,status:response.status,text:await response.text()};
  },{origin,path,params});
}

async function setupPayment(page:Page,plan:CardPlan,qtParcelas:number){
  const result=await getText(page,"/checkout_catalogo/processa_inclui_pagamento_ajax.php",{cod_pagto:plan,qt_parcelas:String(qtParcelas),ajax:"1",_:String(Date.now())});
  if(!result.ok)throw new Error("CARD_PAYMENT_SETUP_FAILED");
  return result.text;
}

async function activateVariableEntry(page:Page){
  const result=await getText(page,"/checkout_catalogo/processa_entrada_variavel_calc_ajax.php",{cod_pagto:"CCC",_:String(Date.now())});
  if(!result.ok)throw new Error("CARD_VARIABLE_ENTRY_FAILED");
  return result.text;
}

async function setVariableEntry(page:Page,paymentId:string,entry:number){
  const result=await getText(page,"/checkout_catalogo/processa_inclui_pagamento_variavel_ajax.php",{cd_pagamento:paymentId,valor:String(entry),_:String(Date.now())});
  if(!result.ok)throw new Error("CARD_ENTRY_PAYMENT_FAILED");
  return result.text;
}

async function includePayment2(page:Page,params:Record<string,string>){
  const result=await getText(page,"/checkout_catalogo/processa_inclui_pagamento2_ajax.php",params);
  if(!result.ok)throw new Error("CARD_PAYMENT_UPDATE_FAILED");
  return result.text;
}

async function setMastercard(page:Page,paymentId:string){
  await getText(page,"/checkout_catalogo/processa_conveniada_ajax.php",{cd_conveniada:"3",cd_pagamento:paymentId,prevent_cache:new Date().toString(),_:String(Date.now())});
}

async function blockEntryEditing(page:Page){
  await getText(page,"/checkout_catalogo/processa_liberar_entradas_ajax.php",{acao:"bloquear_entradas",prevent_cache:String(Date.now()),_:String(Date.now())});
}

async function reloadCart(page:Page){
  const origin=new URL(page.url()).origin;
  await page.goto(`${origin}/checkout_catalogo/carrinho-entrega.php?reload=sim`,{waitUntil:"domcontentloaded",timeout:60000});
  await page.waitForLoadState("networkidle",{timeout:8000}).catch(()=>{});
}

function parseCCSResult(raw:string,installments:number){
  let html=raw;try{const payload=JSON.parse(raw);html=typeof payload?.html==="string"?payload.html:raw;}catch{}
  html=cleanHtml(html);
  for(const row of [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map(m=>m[1])){
    if(!/200\s*-\s*T\s*CREDITO/i.test(row))continue;
    const detail=row.match(/class=["'][^"']*col-detalhes[^"']*["'][^>]*>[\s\S]*?(\d+)\s*x\s*(?:R\$)?\s*([\d.,]+)[\s\S]*?<\/td>/i);
    if(!detail||Number(detail[1])!==installments)continue;
    const installmentValue=parseMoney(detail[2]);if(installmentValue===undefined)continue;
    const total=parseMoney(row.match(/valor-total[^>]*>[\s\S]*?R\$\s*([\d.,]+)/i)?.[1]??html.match(/valor-total[^>]*>[\s\S]*?R\$\s*([\d.,]+)/i)?.[1]);
    return {installmentValue,total};
  }
  const direct=[...html.matchAll(/class=["'][^"']*col-detalhes[^"']*["'][^>]*>[\s\S]*?(\d+)\s*x\s*(?:R\$)?\s*([\d.,]+)[\s\S]*?<\/td>/gi)].map(m=>({count:Number(m[1]),installmentValue:parseMoney(m[2])})).find(x=>x.count===installments&&x.installmentValue!==undefined);
  return direct?{installmentValue:direct.installmentValue,total:undefined}:undefined;
}

async function configureCCSPayment(page:Page,installments:number){
  if(!Number.isInteger(installments)||installments<1||installments>24)throw new Error("CARD_INSTALLMENTS_OUT_OF_RANGE");
  const setup=await setupPayment(page,"CCS",installments);
  let parsed=parseCCSResult(setup,installments);
  if(!parsed?.installmentValue){await reloadCart(page);parsed=parseCCSResult(await page.content(),installments);}
  if(!parsed?.installmentValue)throw new Error("CARD_RESULT_NOT_PARSED");
  return parsed;
}

async function configureCCCWithEntry(page:Page,installments:number,entry:number){
  if(!Number.isInteger(installments)||installments<2||installments>24)throw new Error("CARD_INSTALLMENTS_OUT_OF_RANGE");
  if(!(entry>0))throw new Error("CARD_ENTRY_REQUIRED");

  // HAR real: 10 parcelas + 1 entrada => qt_parcelas=11.
  const totalPayments=installments+1;
  const setup=await setupPayment(page,"CCC",totalPayments);
  let setupHtml=setup;try{setupHtml=JSON.parse(setup)?.html||setup}catch{}
  const setupIds=[...cleanHtml(setupHtml).matchAll(/data-cdpagamento=["'](\d+)["']/gi)].map(m=>m[1]);

  await activateVariableEntry(page);
  await reloadCart(page);

  let state=parseCardDetails(await page.content(),"CCC");
  const entryId=state.entryPaymentId||setupIds[0];
  const parcelIdHint=state.parcelPaymentId||setupIds[1];
  if(!entryId)throw new Error("CARD_PAYMENT_ID_NOT_FOUND");

  // HAR real: grava primeiro o valor da entrada na condição variável.
  await setVariableEntry(page,entryId,entry);
  await reloadCart(page);
  state=parseCardDetails(await page.content(),"CCC");

  // Depois transforma a entrada em DINHEIRO (cod_formpagto=1).
  const entryResult=await includePayment2(page,{cod_pagto:"CCC",cd_pagamento:state.entryPaymentId||entryId,cod_formpagto:"1",tipo_pagto:"P",valor_pagamento:entry.toFixed(2).replace(".",","),_:String(Date.now())});
  if(!entryResult)throw new Error("CARD_ENTRY_PAYMENT_FAILED");
  await blockEntryEditing(page);
  await reloadCart(page);

  const htmlAfterEntry=await page.content();
  state=parseCardDetails(htmlAfterEntry,"CCC");
  const parcelId=state.parcelPaymentId||parcelIdHint;
  if(!parcelId)throw new Error("CARD_PAYMENT_ID_NOT_FOUND");

  const financedAmount=parseMoney(htmlAfterEntry.match(/(?:id|name)=["']valor_parc\[\]["'][^>]*value=["']([^"']+)["']/i)?.[1])??state.total??0;
  if(!(financedAmount>0))throw new Error("CARD_RESULT_NOT_PARSED");

  // Parcelas: 200 - T CREDITO.
  await includePayment2(page,{cod_pagto:"CCC",cd_pagamento:parcelId,cod_formpagto:"200",valor_pagamento:financedAmount.toFixed(2).replace(".",","),_:String(Date.now())});

  // Bandeira: Mastercard = 3. A resposta deste endpoint pode conter texto de erro;
  // o estado persistido no carrinho é a fonte da verdade.
  await setMastercard(page,parcelId);
  await reloadCart(page);

  let final=parseCardDetails(await page.content(),"CCC");
  for(let attempt=0;attempt<5;attempt++){
    if(final.installmentValue!==undefined&&final.parcelPaymentId===parcelId&&final.parcelPaymentForm==="200"&&final.conveniada==="3"&&final.mastercardSelected)break;
    await page.waitForTimeout(500);
    await reloadCart(page);
    final=parseCardDetails(await page.content(),"CCC");
  }
  if(final.installmentValue===undefined||final.parcelPaymentForm!=="200"||final.conveniada!=="3")throw new Error("CARD_PAYMENT_ID_NOT_FOUND");
  return {installmentValue:final.installmentValue,total:entry+(final.total??financedAmount),entry,cardForm:"200 - T CREDITO",brand:"MASTERCARD"};
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
