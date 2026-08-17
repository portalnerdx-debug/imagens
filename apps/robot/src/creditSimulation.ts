import type {Page} from "playwright";
import {CLICK_DEFAULT_CPF} from "./config.js";
import {clickText,pageContains} from "./flowHelpers.js";
import {searchProduct} from "./productSearch.js";
import {extractCreditResult,formatBrazilianMoney,parseCt2MinimumEntry} from "./creditResultParser.js";
import {requiredItemsForPlan,type Ct1RequiredItem} from "./ct1CartRules.js";
import {chooseWarrantyHref} from "./warrantySelection.js";
import {parseWarrantyCartTotal,warrantyServiceCode} from "./warrantyService.js";

export type CreditPlan="48"|"CT1"|"CT2";
export interface CreditRequest{
 code:string;
 plan:CreditPlan;
 installments:number;
 downPayment?:number;
 cpf?:string;
 voltage?:string;
 warranty?:boolean;
}

async function chooseVoltageIfRequested(page:Page,voltage?:string){
 const asksVoltage=await pageContains(page,/110\s*v|127\s*v|220\s*v|voltagem/i);
 if(!asksVoltage)return {required:false,selected:undefined};
 if(!voltage)throw new Error("VOLTAGE_REQUIRED");

 const rx=voltage==="110"?/110\s*v|127\s*v/i:/220\s*v/i;
 if(!await clickText(page,[rx]))throw new Error("VOLTAGE_OPTION_NOT_FOUND");
 await page.waitForTimeout(350);
 return {required:true,selected:voltage};
}

async function chooseWarranty(page:Page,warranty:boolean){
 // Não basta procurar a palavra "garantia": ela também aparece na descrição
 // do produto. A tela real usa garantiaNovo.php e links com op_garantia.
 const links=page.locator('a[href*="op_garantia="]');
 const count=await links.count();
 const hrefs:string[]=[];
 for(let index=0;index<count;index++){
  const href=await links.nth(index).getAttribute("href");
  if(href)hrefs.push(href);
 }
 const html=await page.content().catch(()=>"");
 for(const match of html.matchAll(/((?:https?:\/\/[^"'<>\s]+)?\/?checkout_catalogo\/carrinho\.php\?[^"'<>\s]*op_garantia(?:=|%3D)\d+)/gi)){
  const href=match[1].replace(/&amp;/g,"&");
  if(!hrefs.includes(href))hrefs.push(href);
 }
 const warrantyScreen=/garantiaNovo\.php/i.test(page.url())||hrefs.length>0;
 if(!warrantyScreen)return {shown:false,selected:false};

 const chosenHref=chooseWarrantyHref(hrefs,warranty);
 if(chosenHref){
  for(let index=0;index<count;index++){
   const chosen=links.nth(index);
   if(await chosen.getAttribute("href")!==chosenHref)continue;
   if(await chosen.isVisible({timeout:1000}).catch(()=>false)){
    await chosen.click();
    await page.waitForLoadState("domcontentloaded",{timeout:8000}).catch(()=>{});
    await page.waitForTimeout(300);
    return {shown:true,selected:warranty};
   }
  }
  // Algumas versões da tela guardam a rota somente em JavaScript/onclick.
  // Navegar para essa rota apenas adiciona produto+garantia ao carrinho.
  await page.goto(new URL(chosenHref.replace(/&amp;/g,"&"),page.url()).toString(),{
   waitUntil:"domcontentloaded",timeout:60000
  });
  await page.waitForTimeout(300);
  return {shown:true,selected:warranty};
 }

 const clicked=warranty
  ? await clickText(page,[/com garantia|adicionar garantia|incluir garantia|garantia estendida/i])
  : await clickText(page,[/sem garantia|não quero garantia|nao quero garantia|continuar sem/i]);
 if(!clicked)throw new Error("WARRANTY_OPTION_NOT_FOUND");
 await page.waitForLoadState("domcontentloaded",{timeout:8000}).catch(()=>{});
 await page.waitForTimeout(300);
 return {shown:true,selected:warranty};
}

async function enterCpfAndAdvanceTraditional(page:Page,cpf:string){
 const origin=new URL(page.url()).origin;
 const response=await page.request.post(`${origin}/checkout_catalogo/processa_loginc.php`,{
  params:{tp_pessoa:"PF"},
  form:{nr_documento:cpf},
  headers:{referer:page.url(),origin},
  timeout:60000
 });
 if(!response.ok())throw new Error("CPF_SUBMIT_FAILED");

 // O HAR mostra que, apó processa_loginc.php, a Click abre diretamente esta
 // página. Não dependemos mais do texto variável de um botão da interface.
 await page.goto(`${origin}/checkout_catalogo/carrinho-entrega.php?reload=sim`,{
  waitUntil:"domcontentloaded",timeout:60000
 });
 await page.waitForLoadState("networkidle",{timeout:8000}).catch(()=>{});
}

async function prepareCreditCart(page:Page,plan:CreditPlan,mainProductPrice:number){
 const origin=new URL(page.url()).origin;
 const cartUrl=`${origin}/checkout_catalogo/carrinho.php`;
 const headers={referer:page.url(),"x-requested-with":"XMLHttpRequest"};
 const items=requiredItemsForPlan(plan,mainProductPrice);

 // O carrinho fica associado à sessão da Plataforma Click. Por isso, uma
 // simulação CT1/CT2 anterior pode deixar o AF tradicional no carrinho.
 // Cliente Novo 48 usa exclusivamente o AF 447157.
 if(plan==="48"){
  const removed=await page.request.get(cartUrl,{
   params:{cod:"447164",acao:"excluir"},headers,timeout:60000
  });
  if(!removed.ok())throw new Error("NEW_CUSTOMER_CART_CLEANUP_FAILED");
 }

 const current=await page.request.get(cartUrl,{headers,timeout:60000});
 if(!current.ok())throw new Error("TRADITIONAL_CART_PREPARATION_FAILED");
 let cartHtml=await current.text();

 for(const item of items){
  const alreadyInCart=new RegExp(`(?:c[oó]d\\.?\\s*:\\s*|cod=)${item.code}\\b`,"i").test(cartHtml);
  if(!alreadyInCart){
   const added=await page.request.get(cartUrl,{
    params:{cod:item.code,acao:"incluir"},headers,timeout:60000
   });
   if(!added.ok())throw new Error("TRADITIONAL_CART_PREPARATION_FAILED");
   cartHtml=await added.text();
  }

  // A Click usa este endpoint para fixar a quantidade. Os valores unitários
  // abaixo foram confirmados nos fluxos HAR de CT1, CT2 e Cliente Novo 48.
  const quantity=await page.request.get(`${origin}/checkout_catalogo/carrinho_quantidade_ajax.php`,{
   params:{
    cod:item.code,qtd:String(item.quantity),vl_venda:String(item.unitPrice),
    prevent_cache:new Date().toString(),_:String(Date.now())
   },
   headers,timeout:60000
  });
  if(!quantity.ok())throw new Error("TRADITIONAL_CART_PREPARATION_FAILED");
 }

 await page.goto(cartUrl,{waitUntil:"domcontentloaded",timeout:60000});
 await page.waitForLoadState("networkidle",{timeout:8000}).catch(()=>{});
 return items.map((item:Ct1RequiredItem)=>({code:item.code,quantity:item.quantity,reason:item.reason}));
}

async function applyTraditionalWarrantyService(page:Page,productCode:string,enabled:boolean){
 const origin=new URL(page.url()).origin;
 const serviceCode=warrantyServiceCode(enabled);
 const response=await page.request.get(`${origin}/checkout_catalogo/processa_servico_ajax.php`,{
  params:{
   cd_itprodd:productCode,cd_servico:serviceCode,op_servico:"Y",_:String(Date.now())
  },
  headers:{referer:page.url(),"x-requested-with":"XMLHttpRequest"},
  timeout:60000
 });
 if(!response.ok())throw new Error("WARRANTY_SERVICE_FAILED");
 const cartTotal=parseWarrantyCartTotal(await response.text());
 if(cartTotal===undefined)throw new Error("WARRANTY_SERVICE_FAILED");
 return {
  shown:true,selected:enabled,serviceCode,
  cartTotalAfterWarranty:cartTotal,
  message:enabled?"Garantia adicional aplicada ao produto principal.":"Produto principal mantido sem garantia adicional."
 };
}

async function simulateCt1(page:Page,req:CreditRequest,context:{
 product:unknown;voltage:unknown;warranty:unknown;
 requiredProducts?:Array<{code:string;quantity:number;reason:string}>;
}){
 if(req.installments<1||req.installments>24)throw new Error("CT1_INSTALLMENTS_OUT_OF_RANGE");

 const origin=new URL(page.url()).origin;
 const referer=page.url();
 const response=await page.request.get(`${origin}/checkout_catalogo/processa_inclui_pagamento_ajax.php`,{
  params:{cod_pagto:"CT1",qt_parcelas:String(req.installments),ajax:"1",_:String(Date.now())},
  headers:{referer,"x-requested-with":"XMLHttpRequest"},
  timeout:60000
 });
 if(!response.ok())throw new Error("CREDIT_REQUEST_FAILED");

 // O endpoint grava a condição na sessão. O resultado aparece somente depois
 // que carrinho-entrega.php é recarregado, exatamente como observado no HAR.
 await page.goto(`${origin}/checkout_catalogo/carrinho-entrega.php?reload=sim`,{
  waitUntil:"domcontentloaded",timeout:60000
 });
 await page.waitForLoadState("networkidle",{timeout:8000}).catch(()=>{});
 const text=(await page.locator("body").innerText()).slice(0,30000);
 const result=extractCreditResult(text,req);
 if(result.installmentValue===undefined)throw new Error("CREDIT_RESULT_NOT_PARSED");

 return {
  ok:true,
  ...result,
  ...context,
  status:"CT1_SIMULATED",
  message:"Tradicional sem entrada consultado na Plataforma Click.",
  safeStop:"Simulação CT1 concluída. Nenhuma compra ou pedido foi confirmado."
 };
}

async function reloadPaymentPage(page:Page,origin:string){
 await page.goto(`${origin}/checkout_catalogo/carrinho-entrega.php?reload=sim`,{
  waitUntil:"domcontentloaded",timeout:60000
 });
 await page.waitForLoadState("networkidle",{timeout:8000}).catch(()=>{});
}

function variableEntryError(plan:CreditPlan,suffix:string){
 return `${plan}_${suffix}`;
}

async function simulateVariableEntry(page:Page,req:CreditRequest,context:{
 product:unknown;voltage:unknown;warranty:unknown;
 requiredProducts?:Array<{code:string;quantity:number;reason:string}>;
}){
 if(req.installments<2||req.installments>24)throw new Error(variableEntryError(req.plan,"INSTALLMENTS_OUT_OF_RANGE"));
 const downPayment=Number(req.downPayment||0);
 if(!(downPayment>0))throw new Error("ENTRY_REQUIRED");

 const origin=new URL(page.url()).origin;
 const headers={referer:page.url(),"x-requested-with":"XMLHttpRequest"};

 // 1) Seleciona a condição e a quantidade total de pagamentos (entrada + parcelas).
 const plan=await page.request.get(`${origin}/checkout_catalogo/processa_inclui_pagamento_ajax.php`,{
  params:{cod_pagto:req.plan,qt_parcelas:String(req.installments),ajax:"1",_:String(Date.now())},
  headers,timeout:60000
 });
 if(!plan.ok())throw new Error(variableEntryError(req.plan,"PAYMENT_SETUP_FAILED"));
 await reloadPaymentPage(page,origin);

 // 2) Marca Entrada Variável e recarrega, como a interface da Click.
 const variable=await page.request.get(`${origin}/checkout_catalogo/processa_entrada_variavel_calc_ajax.php`,{
  params:{cod_pagto:req.plan,_:String(Date.now())},headers,timeout:60000
 });
 if(!variable.ok())throw new Error(variableEntryError(req.plan,"VARIABLE_ENTRY_FAILED"));
 await reloadPaymentPage(page,origin);

 const beforeEntry=(await page.locator("body").innerText()).slice(0,30000);
 const minimum=parseCt2MinimumEntry(beforeEntry);
 if(minimum!==undefined&&downPayment<minimum)throw new Error(variableEntryError(req.plan,"ENTRY_BELOW_MINIMUM"));

 // A linha de entrada recebe um identificador dinâmico a cada simulação.
 const entrySection=page.locator("#pagamentos_ent");
 const paymentId=await entrySection.locator("[data-cdpagamento]").first().getAttribute("data-cdpagamento")
  ||await entrySection.locator("[data-item]").first().getAttribute("data-item");
 if(!paymentId||!/^\d+$/.test(paymentId))throw new Error(variableEntryError(req.plan,"PAYMENT_ID_NOT_FOUND"));

 // 3) Preenche a entrada. A chamada abaixo é o evento disparado quando o
 // vendedor clica fora do campo (blur/change) no site da Plataforma Click.
 const entry=await page.request.get(`${origin}/checkout_catalogo/processa_inclui_pagamento_variavel_ajax.php`,{
  params:{cd_pagamento:paymentId,valor:formatBrazilianMoney(downPayment),_:String(Date.now())},
  headers,timeout:60000
 });
 if(!entry.ok())throw new Error(variableEntryError(req.plan,"VARIABLE_ENTRY_FAILED"));
 await reloadPaymentPage(page,origin);

 const text=(await page.locator("body").innerText()).slice(0,40000);
 const result=extractCreditResult(text,req);
 if(result.installmentValue===undefined||result.total===undefined)throw new Error("CREDIT_RESULT_NOT_PARSED");

 return {
  ok:true,...result,...context,
  minimumEntry:minimum,
  status:req.plan==="48"?"NEW_CUSTOMER_48_SIMULATED":"CT2_SIMULATED",
  message:req.plan==="48"
   ?"Cliente Novo com entrada variável consultado na Plataforma Click."
   :"Tradicional com entrada variável consultado na Plataforma Click.",
  safeStop:`Simulação ${req.plan} concluída. Nenhuma compra ou pedido foi confirmado.`
 };
}

export async function simulateCredit(page:Page,req:CreditRequest){
 if(!["48","CT1","CT2"].includes(req.plan))throw new Error("INVALID_PLAN");
 if(!Number.isInteger(req.installments)||req.installments<1||req.installments>48)throw new Error("INVALID_INSTALLMENTS");
 if(req.plan==="CT1"&&req.installments>24)throw new Error("CT1_INSTALLMENTS_OUT_OF_RANGE");
 if((req.plan==="CT2"||req.plan==="48")&&(req.installments<2||req.installments>24)){
  throw new Error(variableEntryError(req.plan,"INSTALLMENTS_OUT_OF_RANGE"));
 }
 if((req.plan==="CT2"||req.plan==="48")&&Number(req.downPayment||0)<=0)throw new Error("ENTRY_REQUIRED");

 const cpf=(req.cpf||CLICK_DEFAULT_CPF).replace(/\D/g,"");
 if(cpf.length!==11)throw new Error("CPF_REQUIRED");

 const product=await searchProduct(page,req.code);
 if(!product.found)throw new Error("PRODUCT_NOT_FOUND");

 // Click product result, then "Comprar".
 const codeMatch=page.getByText(req.code,{exact:false}).first();
 if(await codeMatch.isVisible({timeout:1800}).catch(()=>false))await codeMatch.click();
 await page.waitForTimeout(450);

 if(!await clickText(page,[/^comprar$/i,/adicionar.*carrinho/i,/selecionar/i])){
  throw new Error("BUY_ACTION_NOT_FOUND");
 }
 await page.waitForTimeout(650);

 const voltage=await chooseVoltageIfRequested(page,req.voltage);
 let warranty=await chooseWarranty(page,Boolean(req.warranty));
 const requiredProducts=await prepareCreditCart(page,req.plan,Number(product.price));
 warranty=await applyTraditionalWarrantyService(page,req.code,Boolean(req.warranty));
 await enterCpfAndAdvanceTraditional(page,cpf);

 if(req.plan==="CT1"){
  return simulateCt1(page,req,{product,voltage,warranty,requiredProducts});
 }
 if(req.plan==="CT2"||req.plan==="48"){
  return simulateVariableEntry(page,req,{product,voltage,warranty,requiredProducts});
 }
 throw new Error("INVALID_PLAN");
}
