import type {Page} from "playwright";
import {CLICK_DEFAULT_CPF} from "./config.js";
import {clickText,pageContains} from "./flowHelpers.js";
import {searchProduct} from "./productSearch.js";

export interface CardRequest{
  code:string;
  installments:number;
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

async function parseCardPaymentHtml(html:string,installments:number){
  const detailMatch=html.match(/class=["']col-detalhes["'][^>]*>\s*([\s\S]*?)<\/td>/i);
  const detailText=(detailMatch?.[1]||"").replace(/<[^>]+>/g," ").replace(/&nbsp;/gi," ").replace(/\s+/g," ").trim();
  const detail=detailText || html.replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<style[\s\S]*?<\/style>/gi," ").replace(/<[^>]+>/g," ").replace(/\s+/g," ");

  // No HTML real da Click o retorno CCS traz, por exemplo, "10x 7,99".
  const parcelRegex=new RegExp(`(?:${installments}\\s*x\\s*|em\\s*${installments}\\s*x\\s*|${installments}\\s*[xX]\\s*)([0-9.]+,[0-9]{2})`,'i');
  const genericRegex=/(\d+)\s*x\s*([0-9.]+,[0-9]{2})/i;
  const match=detail.match(parcelRegex)||detail.match(genericRegex);
  const installmentValue=match?Number((match[1]||match[2]).replace(/\./g,"").replace(",",".")):undefined;

  const totalMatch=html.match(/class=["'][^"']*valor-total[^"']*["'][^>]*>[^R$]*R\$\s*([0-9.]+,[0-9]{2})/i)
    ||html.match(/name=["'](?:total_carrinho|vl_pedido)["'][^>]*value=["']([0-9.]+(?:,[0-9]{2})?)["']/i);
  const total=totalMatch?Number(totalMatch[1].replace(/\./g,"").replace(",",".")):undefined;

  return {installmentValue,total,detail:detailText};
}

async function configureCardPayment(page:Page,installments:number){
  if(!Number.isInteger(installments)||installments<1||installments>24)throw new Error("CARD_INSTALLMENTS_OUT_OF_RANGE");
  const origin=new URL(page.url()).origin;
  const endpoint=`${origin}/checkout_catalogo/processa_inclui_pagamento_ajax.php`;
  const result=await page.evaluate(async({endpoint,installments})=>{
    const url=new URL(endpoint,window.location.href);
    url.searchParams.set("cod_pagto","CCS");
    url.searchParams.set("qt_parcelas",String(installments));
    url.searchParams.set("ajax","1");
    url.searchParams.set("_",String(Date.now()));
    const response=await fetch(url.toString(),{
      credentials:"include",cache:"no-store",
      headers:{"Accept":"application/json, text/javascript, */*; q=0.01","X-Requested-With":"XMLHttpRequest"}
    });
    return {ok:response.ok,status:response.status,text:await response.text()};
  },{endpoint,installments});
  if(!result.ok)throw new Error("CARD_PAYMENT_SETUP_FAILED");

  // A resposta AJAX real da Click já traz o formulário completo de pagamento.
  // O HTML do HAR contém diretamente "10x 7,99" e "Total: R$ 79,90".
  let html="";
  try{
    const payload=JSON.parse(result.text);
    html=typeof payload?.html==="string"?payload.html:result.text;
  }catch{
    html=result.text;
  }

  let parsed=await parseCardPaymentHtml(html,installments);

  // Fallback para versões da Click que persistem a condição somente após o reload.
  if(parsed.installmentValue===undefined){
    await page.goto(`${origin}/checkout_catalogo/carrinho-entrega.php?reload=sim`,{
      waitUntil:"domcontentloaded",timeout:60000
    });
    await page.waitForLoadState("networkidle",{timeout:8000}).catch(()=>{});
    const bodyHtml=await page.content().catch(()=>"");
    parsed=await parseCardPaymentHtml(bodyHtml,installments);
  }

  if(parsed.installmentValue===undefined){
    console.error("[card] resultado CCS não identificado",{
      installments,url:page.url(),
      responseBytes:result.text.length,
      hasJsonHtml:/"html"\s*:/i.test(result.text),
      hasDetails:/col-detalhes|pagamentos_pgs/i.test(html),
      detail:parsed.detail
    });
    throw new Error("CARD_RESULT_NOT_PARSED");
  }

  return {installmentValue:parsed.installmentValue,total:parsed.total};
}

export async function simulateCard(page:Page,req:CardRequest){
  if(!req.code)throw new Error("PRODUCT_CODE_REQUIRED");
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
  const payment=await configureCardPayment(page,req.installments);

  return {
    ok:true,
    productCode:req.code,
    installments:req.installments,
    installmentValue:payment.installmentValue,
    total:payment.total,
    voltage:req.voltage||undefined,
    status:"CARD_CREDIT_SIMULATED",
    message:"Consulta de cartão de crédito concluída na Plataforma Click. Nenhuma compra foi confirmada.",
    safeStop:"Simulação de cartão concluída. Nenhuma compra ou pedido foi confirmado.",
    product
  };
}
