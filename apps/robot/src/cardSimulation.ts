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
  const rows:Array<{id?:string;details?:string;value?:number;form?:string;conveniada?:string;type?:string}>=[];
  const rowRegex=/<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  for(const rowMatch of html.matchAll(rowRegex)){
    const row=rowMatch[1];
    if(!/remove-payment/i.test(row))continue;
    const id=row.match(/remove-payment[\s\S]*?data-item=["'](\d+)["']/i)?.[1];
    if(!id)continue;
    const type=row.match(/remove-payment[\s\S]*?data-type=["']([EP])["']/i)?.[1];
    const value=parseMoney(
      row.match(/class=["']valor["'][^>]*value=["']([^"']+)["']/i)?.[1]
      ?? row.match(/name=["']valor_(?:ent|parc)\[\]["'][^>]*value=["']([^"']+)["']/i)?.[1]
    );
    const details=row.match(/class=["']col-detalhes["'][^>]*>([\s\S]*?)<\/td>/i)?.[1]
      ?.replace(/<[^>]+>/g," ").replace(/&nbsp;/gi," ").replace(/\s+/g," ").trim();
    const form=row.match(/class=["']change-payment["'][\s\S]*?<option[^>]*value=['"](\d+)['"][^>]*selected(?:=['"][^"']*['"])?[^>]*>/i)?.[1]
      ?? row.match(/class=["']change-payment["'][\s\S]*?<option[^>]*selected[^>]*value=['"](\d+)['"]/i)?.[1];
    const conv=row.match(/class=["']selectinho2["'][\s\S]*?<option[^>]*value=['"](\d+)['"][^>]*selected(?:=['"][^"']*['"])?[^>]*>/i)?.[1]
      ?? row.match(/class=["']selectinho2["'][\s\S]*?<option[^>]*selected[^>]*value=['"](\d+)['"]/i)?.[1];
    rows.push({id,details,value,form,conveniada:conv,type});
  }
  return rows;
}

async function readPaymentState(page:Page){
  const html=await page.content();
  const rows=parsePaymentRows(html);
  const entryRow=rows.find(r=>r.type==='E' || r.form==='1');
  const parcelRow=rows.find(r=>r.type==='P' && r.form==='200')
    ?? rows.find(r=>r.type==='P')
    ?? rows.find(r=>r.form==='200')
    ?? rows.find(r=>/\d+\s*x\s*(?:R\$)?\s*[\d.,]+/i.test(r.details||''));
  const detail=parcelRow?.details||'';
  const match=detail.match(/(\d+)\s*x\s*(?:R\$)?\s*([\d.,]+)/i);
  const installmentValue=parseMoney(match?.[2]);
  return {
    installmentValue,
    entry:entryRow?.value,
    entryPaymentId:entryRow?.id,
    parcelPaymentId:parcelRow?.id,
    parcelTotal:parcelRow?.value,
    parcelForm:parcelRow?.form,
    conveniada:parcelRow?.conveniada
  };
}

function parseCardDetails(html:string,plan:CardPlan){
  const rows=parsePaymentRows(html);
  const entryRow=rows.find(r=>r.type==='E' || r.form==='1');
  const parcelRow=rows.find(r=>r.type==='P' && r.form==='200')
    ?? rows.find(r=>plan==='CCC' && r.type==='P' && r.conveniada==='3')
    ?? rows.find(r=>r.type==='P' && /\d+\s*x\s*(?:R\$)?\s*[\d.,]+/i.test(r.details||''));
  const detail=parcelRow?.details||'';
  const match=detail.match(/(\d+)\s*x\s*(?:R\$)?\s*([\d.,]+)/i);
  const installmentValue=parseMoney(match?.[2]);
  const parcelTotal=parseMoney(html.match(/class=["'][^"']*valor-total[^"']*["'][^>]*>\s*(?:Total\s+Parcelas|Total\s+financiamento)[:\s]+R\$?\s*([\d.,]+)/i)?.[1]);
  const genericTotal=parseMoney(html.match(/class=["'][^"']*valor-total[^"']*["'][^>]*>\s*Total[:\s]+R\$?\s*([\d.,]+)/i)?.[1]);
  const valueParc=parseMoney(html.match(/name=["']valor_parc\[\]["'][^>]*value=["']([^"']+)["']/i)?.[1]);
  const resolvedInstallmentValue=installmentValue ?? (valueParc!==undefined && match?.[1]?valueParc/Number(match[1]):undefined);
  return {
    installmentValue:resolvedInstallmentValue,
    total:genericTotal??parcelTotal,
    details:detail,
    entry:entryRow?.value,
    entryPaymentId:entryRow?.id,
    parcelPaymentId:parcelRow?.id,
    parcelPaymentForm:parcelRow?.form,
    conveniada:parcelRow?.conveniada,
    mastercardSelected:/<option[^>]*value=['"]3['"][^>]*selected/i.test(html)
  };
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

async function activateVariableEntry(page:Page){
  const origin=new URL(page.url()).origin;
  const response=await page.request.get(`${origin}/checkout_catalogo/processa_entrada_variavel_calc_ajax.php`,{
    params:{cod_pagto:"CCC",_:String(Date.now())},
    headers:{referer:page.url(),"x-requested-with":"XMLHttpRequest"},timeout:60000
  });
  if(!response.ok())throw new Error("CARD_VARIABLE_ENTRY_FAILED");
  return response.text();
}

async function setPaymentForm(page:Page,params:Record<string,string>){
  const origin=new URL(page.url()).origin;
  const response=await page.request.get(`${origin}/checkout_catalogo/processa_inclui_pagamento2_ajax.php`,{
    params,headers:{referer:page.url(),"x-requested-with":"XMLHttpRequest"},timeout:60000
  });
  if(!response.ok())throw new Error("CARD_PAYMENT_UPDATE_FAILED");
  return response.text();
}

async function setMastercard(page:Page,paymentId:string){
  const origin=new URL(page.url()).origin;
  const response=await page.request.get(`${origin}/checkout_catalogo/processa_conveniada_ajax.php`,{
    params:{cd_conveniada:"3",cd_pagamento:paymentId,prevent_cache:new Date().toString(),_:String(Date.now())},
    headers:{referer:page.url(),"x-requested-with":"XMLHttpRequest"},timeout:60000
  });
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
  const setup=await setupPayment(page,"CCS",installments);
  let html=setup;
  try{html=JSON.parse(setup)?.html||setup}catch{}
  let parsed=parseCardDetails(html,"CCS");
  if(parsed.installmentValue===undefined){
    await reloadCart(page);
    parsed=parseCardDetails(await page.content(),"CCS");
  }
  if(parsed.installmentValue===undefined)throw new Error("CARD_RESULT_NOT_PARSED");
  return {installmentValue:parsed.installmentValue,total:parsed.total};
}

async function configureCCCWithEntry(page:Page,installments:number,entry:number){
  if(!Number.isInteger(installments)||installments<2||installments>24)throw new Error("CARD_INSTALLMENTS_OUT_OF_RANGE");
  if(!(entry>0))throw new Error("CARD_ENTRY_REQUIRED");

  // HAR real: 10 parcelas + 1 entrada => qt_parcelas=11.
  const totalPayments=installments+1;
  const setupText=await setupPayment(page,"CCC",totalPayments);
  let setupHtml=setupText;
  try{setupHtml=JSON.parse(setupText)?.html||setupText}catch{}

  // O HTML retornado pela própria Click já traz os IDs reais de entrada e parcela.
  // Não use o primeiro data-item, pois ele é o índice do formulário (ex.: 1).
  const paymentIds=[...setupHtml.matchAll(/data-cdpagamento=["'](\d+)["']/gi)].map(m=>m[1]);
  const setupEntryId=paymentIds[0];
  const setupParcelId=paymentIds[1];

  await activateVariableEntry(page);
  await reloadCart(page);

  let state=await readPaymentState(page);
  const entryId=state.entryPaymentId||setupEntryId;
  const parcelIdFromSetup=state.parcelPaymentId||setupParcelId;
  if(!entryId)throw new Error("CARD_PAYMENT_ID_NOT_FOUND");

  // No HAR, a entrada é aplicada por processa_inclui_pagamento2_ajax.php.
  const entryValue=entry.toFixed(2).replace(".",",");
  const entryResult=await setPaymentForm(page,{
    cod_pagto:"CCC",
    cd_pagamento:entryId,
    cod_formpagto:"1",
    tipo_pagto:"P",
    valor_pagamento:entryValue,
    _:String(Date.now())
  });
  if(!entryResult)throw new Error("CARD_ENTRY_PAYMENT_FAILED");

  await reloadCart(page);
  state=await readPaymentState(page);
  const parcelId=state.parcelPaymentId||parcelIdFromSetup;
  if(!parcelId)throw new Error("CARD_PAYMENT_ID_NOT_FOUND");

  // Após a entrada, valor_parc[] contém o total financiado das parcelas.
  const htmlAfterEntry=await page.content();
  const parcelTotal=parseMoney(
    htmlAfterEntry.match(/name=["']valor_parc\[\]["'][^>]*value=["']([^"']+)["']/i)?.[1]
  ) ?? state.parcelTotal;
  if(parcelTotal===undefined)throw new Error("CARD_RESULT_NOT_PARSED");

  const parcelResult=await setPaymentForm(page,{
    cod_pagto:"CCC",
    cd_pagamento:parcelId,
    cod_formpagto:"200",
    valor_pagamento:parcelTotal.toFixed(2).replace(".",","),
    _:String(Date.now())
  });
  if(!parcelResult)throw new Error("CARD_INSTALLMENT_PAYMENT_FAILED");

  await reloadCart(page);
  state=await readPaymentState(page);
  if(state.parcelPaymentId!==parcelId||state.parcelForm!=="200")throw new Error("CARD_PAYMENT_ID_NOT_FOUND");

  // O HAR mostra que a conveniada 3 é Mastercard. A Click pode responder texto de erro,
  // mas a seleção persistida é validada no carrinho recarregado.
  await setMastercard(page,parcelId);
  await reloadCart(page);

  let final=await readPaymentState(page);
  for(let attempt=0;attempt<4;attempt++){
    const mastercard=final.conveniada==="3";
    if(mastercard&&final.parcelPaymentId===parcelId&&final.parcelForm==="200"&&final.installmentValue!==undefined)break;
    await page.waitForTimeout(500);
    await reloadCart(page);
    final=await readPaymentState(page);
  }

  if(final.conveniada!=="3"||final.parcelPaymentId!==parcelId||final.parcelForm!=="200"||final.installmentValue===undefined){
    console.error("[card CCC] condição não confirmada",{entryId,parcelId,setupEntryId,setupParcelId});
    throw new Error("CARD_PAYMENT_ID_NOT_FOUND");
  }

  return {
    installmentValue:final.installmentValue,
    total:(final.entry??entry)+(final.parcelTotal??parcelTotal),
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