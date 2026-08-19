import type {Page} from "playwright";
import {CLICK_DEFAULT_CPF} from "./config.js";
import {clickText,pageContains} from "./flowHelpers.js";
import {searchProduct} from "./productSearch.js";
import {extractCreditResult,formatBrazilianMoney,parseCt2MinimumEntry} from "./creditResultParser.js";
import {
 baseRequiredItemsForPlan,PRESTAMISTA_CODES,prestamistaItemForTotal,type Ct1RequiredItem
} from "./ct1CartRules.js";
import {chooseWarrantyHref} from "./warrantySelection.js";
import {parseWarrantyCartTotal,warrantyServiceCode} from "./warrantyService.js";
import {parseCartProductCodes} from "./cartCleanup.js";
import {isPaymentEntryId,parsePaymentEntryId,parsePaymentEntryIdPayload} from "./paymentEntryId.js";

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
 // Depois de clicar em Comprar, a Click abre este modal. O título do produto
 // atrás dele também contém "110V" e é considerado visível pelo navegador,
 // porém não pode receber clique porque o modal intercepta os eventos.
 const confirmationModal=page.locator("#ModalConfirmacao").first();
 const modalVisible=await confirmationModal.isVisible({timeout:2500}).catch(()=>false);
 if(modalVisible){
  if(!voltage)throw new Error("VOLTAGE_REQUIRED");
  const rx=voltage==="110"?/110\s*v|127\s*v/i:/220\s*v/i;
  const option=confirmationModal.getByRole("link",{name:rx}).first();
  if(!await option.isVisible({timeout:2000}).catch(()=>false)){
   throw new Error("VOLTAGE_OPTION_NOT_FOUND");
  }
  await option.click();
  await page.waitForLoadState("domcontentloaded",{timeout:8000}).catch(()=>{});
  await page.waitForTimeout(350);
  return {required:true,selected:voltage};
 }

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

async function addRequiredCartItems(page:Page,items:Ct1RequiredItem[]){
 const origin=new URL(page.url()).origin;
 const cartUrl=`${origin}/checkout_catalogo/carrinho.php`;
 const headers={referer:page.url(),"x-requested-with":"XMLHttpRequest"};

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
  if(item.unitPrice!==undefined){
   const quantity=await page.request.get(`${origin}/checkout_catalogo/carrinho_quantidade_ajax.php`,{
    params:{
     cod:item.code,qtd:String(item.quantity),vl_venda:String(item.unitPrice),
     prevent_cache:new Date().toString(),_:String(Date.now())
    },
    headers,timeout:60000
   });
   if(!quantity.ok())throw new Error("TRADITIONAL_CART_PREPARATION_FAILED");
  }
 }

 await page.goto(cartUrl,{waitUntil:"domcontentloaded",timeout:60000});
 await page.waitForLoadState("networkidle",{timeout:8000}).catch(()=>{});
 return items.map((item:Ct1RequiredItem)=>({code:item.code,quantity:item.quantity,reason:item.reason}));
}

async function prepareBaseCreditCart(page:Page,plan:CreditPlan){
 return addRequiredCartItems(page,baseRequiredItemsForPlan(plan));
}

async function preparePrestamistaBand(page:Page,totalWithoutPrestamista:number){
 const origin=new URL(page.url()).origin;
 const cartUrl=`${origin}/checkout_catalogo/carrinho.php`;
 const headers={referer:page.url(),"x-requested-with":"XMLHttpRequest"};
 const selected=prestamistaItemForTotal(totalWithoutPrestamista);

 // Nunca podem existir duas faixas juntas. Removemos todos os cinco códigos
 // possíveis antes de adicionar exatamente o que corresponde ao subtotal.
 for(const code of PRESTAMISTA_CODES){
  const removed=await page.request.get(cartUrl,{
   params:{cod:code,acao:"excluir"},headers,timeout:60000
  });
  if(!removed.ok())throw new Error("PRESTAMISTA_BAND_SETUP_FAILED");
 }

 const added=await page.request.get(cartUrl,{
  params:{cod:selected.code,acao:"incluir"},headers,timeout:60000
 });
 if(!added.ok())throw new Error("PRESTAMISTA_BAND_SETUP_FAILED");

 // A inclusão já cria uma unidade e usa o preço oficial da Plataforma Click.
 await page.goto(cartUrl,{waitUntil:"domcontentloaded",timeout:60000});
 await page.waitForLoadState("networkidle",{timeout:8000}).catch(()=>{});
 const cartCodes=parseCartProductCodes(await page.content());
 const present=PRESTAMISTA_CODES.filter(code=>cartCodes.includes(code));
 if(present.length!==1||present[0]!==selected.code){
  throw new Error("PRESTAMISTA_BAND_SETUP_FAILED");
 }
 return {code:selected.code,quantity:1,reason:selected.reason};
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
 const endpoint=`${origin}/checkout_catalogo/processa_inclui_pagamento_ajax.php`;
 const params={cod_pagto:"CT1",qt_parcelas:String(req.installments),ajax:"1",_:String(Date.now())};
 const response=await browserAjaxGet(page,endpoint,params);
 if(!response.ok)throw new Error("CREDIT_REQUEST_FAILED");

 // O endpoint grava a condição na sessão. O resultado aparece somente depois
 // que carrinho-entrega.php é recarregado, exatamente como observado no HAR.
 await page.goto(`${origin}/checkout_catalogo/carrinho-entrega.php?reload=sim`,{
  waitUntil:"domcontentloaded",timeout:60000
 });
 await page.waitForLoadState("networkidle",{timeout:8000}).catch(()=>{});
 let text=await readCt1ResultText(page);
 let result=extractCreditResult(text,req);
 if(result.installmentValue===undefined){
  // Em sessões mais lentas a primeira resposta HTTP termina antes de a Click
  // persistir a condição. Repetimos somente a inclusão CT1, não a simulação.
  const retried=await browserAjaxGet(page,endpoint,{...params,_:String(Date.now())});
  if(retried.ok){
   await reloadPaymentPage(page,origin);
   text=await readCt1ResultText(page);
   result=extractCreditResult(text,req);
  }
 }
 if(result.installmentValue===undefined){
  console.error("[credit] resultado CT1 não identificado",{
   url:page.url(),installments:req.installments,
   hasCt1:/\bCT1\b/i.test(text),
   hasPaymentTable:/Forma de Pagto|Detalhes|Total/i.test(text),
   resultBytes:text.length
  });
  throw new Error("CREDIT_RESULT_NOT_PARSED");
 }

 return {
  ok:true,
  ...result,
  ...context,
  status:"CT1_SIMULATED",
  message:"Tradicional sem entrada consultado na Plataforma Click.",
  safeStop:"Simulação CT1 concluída. Nenhuma compra ou pedido foi confirmado."
 };
}

async function readCt1ResultText(page:Page){
 // No HTML real a linha fica em pagamentos_pgs. Ler o formulário diretamente
 // evita perdê-la ao cortar os primeiros caracteres do texto completo da tela.
 const payment=page.locator('#pagamentos_pgs, form[name="pagamentos_pgs"]').first();
 if(await payment.count()){
  const text=await payment.innerText({timeout:5000}).catch(()=>"");
  const total=await page.locator(".valor-novo").first().innerText({timeout:1200}).catch(()=>"");
  if(text)return `${text}\n${total}`;
 }

 const row=page.locator('[data-id="CT1"]').first().locator("xpath=ancestor::tr[1]");
 const rowText=await row.innerText({timeout:2500}).catch(()=>"");
 const totals=await page.locator(".valor-total, .valor-novo").allInnerTexts().catch(()=>[]);
 if(rowText)return `${rowText}\n${totals.join("\n")}`;

 // Fallback sem corte inicial: a tabela costuma ficar no final da página.
 const body=await page.locator("body").innerText().catch(()=>"");
 return body.slice(-50000);
}

async function reloadPaymentPage(page:Page,origin:string){
 await page.goto(`${origin}/checkout_catalogo/carrinho-entrega.php?reload=sim`,{
  waitUntil:"domcontentloaded",timeout:60000
 });
 await page.waitForLoadState("networkidle",{timeout:8000}).catch(()=>{});
}

/** Executa o mesmo GET AJAX do site dentro da página e da sessão autenticada. */
async function browserAjaxGet(page:Page,endpoint:string,params:Record<string,string>){
 return page.evaluate(async({endpoint,params})=>{
  const url=new URL(endpoint,window.location.href);
  for(const [key,value] of Object.entries(params))url.searchParams.set(key,value);
  const response=await fetch(url.toString(),{
   method:"GET",
   credentials:"include",
   cache:"no-store",
   headers:{
    "Accept":"application/json, text/javascript, */*; q=0.01",
    "X-Requested-With":"XMLHttpRequest"
   }
  });
  return {ok:response.ok,status:response.status,text:await response.text(),url:response.url};
 },{endpoint,params});
}

async function readPaymentEntryId(page:Page,origin:string,plan:CreditPlan){
 const selectors:Array<[string,string]>=[
  ['#pagamentos_ent [data-cdpagamento]',"data-cdpagamento"],
  ['form[name="pagamentos_ent"] [data-cdpagamento]',"data-cdpagamento"],
  ['#pagamentos_ent .remove-payment[data-item]',"data-item"],
  ['#pagamentos_ent .col-excluir [data-item]',"data-item"],
  ['#pagamentos_ent .entrada-variavel[data-item]',"data-item"],
  ['#pagamentos_ent [data-item]',"data-item"]
 ];

 for(let attempt=0;attempt<2;attempt++){
  for(const [selector,attribute] of selectors){
   const locator=page.locator(selector).first();
   if(await locator.count()===0)continue;
   const value=await locator.getAttribute(attribute,{timeout:1200}).catch(()=>null);
   if(isPaymentEntryId(value||undefined))return value;
  }

  const parsed=parsePaymentEntryId(await page.content().catch(()=>""));
  if(parsed)return parsed;
  if(attempt===0)await reloadPaymentPage(page,origin);
 }

 const body=(await page.locator("body").innerText().catch(()=>"")).slice(0,12000);
 console.error("[credit] identificador da entrada não encontrado",{
  plan,url:page.url(),
  hasPaymentsForm:/pagamentos_ent/i.test(await page.content().catch(()=>"")),
  hasVariableEntry:/entrada\s+vari[aá]vel/i.test(body),
  hasPrestamistaWarning:/prestamista\s+fora|faixa\s+incorreta/i.test(body)
 });
 return undefined;
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
 const planEndpoint=`${origin}/checkout_catalogo/processa_inclui_pagamento_ajax.php`;
 const planParams={cod_pagto:req.plan,qt_parcelas:String(req.installments),ajax:"1",_:String(Date.now())};

 // 1) Seleciona a condição e a quantidade total de pagamentos (entrada + parcelas).
 const plan=await browserAjaxGet(page,planEndpoint,planParams);
 if(!plan.ok)throw new Error(variableEntryError(req.plan,"PAYMENT_SETUP_FAILED"));
 const planPayload=plan.text;
 const paymentIdFromSetup=parsePaymentEntryIdPayload(planPayload);
 await reloadPaymentPage(page,origin);
 const paymentIdFromSetupPage=parsePaymentEntryId(await page.content().catch(()=>""));

 // 2) Marca Entrada Variável e recarrega, como a interface da Click.
 const variableEndpoint=`${origin}/checkout_catalogo/processa_entrada_variavel_calc_ajax.php`;
 const variable=await browserAjaxGet(page,variableEndpoint,{
  cod_pagto:req.plan,_:String(Date.now())
 });
 if(!variable.ok)throw new Error(variableEntryError(req.plan,"VARIABLE_ENTRY_FAILED"));
 const variablePayload=variable.text;
 const paymentIdFromVariable=parsePaymentEntryIdPayload(variablePayload);
 await reloadPaymentPage(page,origin);

 const beforeEntry=(await page.locator("body").innerText()).slice(0,30000);
 const minimum=parseCt2MinimumEntry(beforeEntry);
 if(minimum!==undefined&&downPayment<minimum)throw new Error(variableEntryError(req.plan,"ENTRY_BELOW_MINIMUM"));

 // A linha de entrada recebe um identificador dinâmico a cada simulação.
 let paymentId=paymentIdFromSetup
  ||paymentIdFromSetupPage
  ||paymentIdFromVariable
  ||await readPaymentEntryId(page,origin,req.plan);
 let rebuiltPayload="";
 if(!paymentId){
  // Algumas sessões devolvem vazio na primeira inclusão. Refazemos a condição
  // uma única vez dentro do navegador e reativamos a entrada antes de desistir.
  const rebuilt=await browserAjaxGet(page,planEndpoint,{...planParams,_:String(Date.now())});
  if(rebuilt.ok){
   rebuiltPayload=rebuilt.text;
   paymentId=parsePaymentEntryIdPayload(rebuiltPayload);
   await browserAjaxGet(page,variableEndpoint,{cod_pagto:req.plan,_:String(Date.now())});
   await reloadPaymentPage(page,origin);
   paymentId=paymentId||parsePaymentEntryId(await page.content().catch(()=>""));
  }
 }
 if(!paymentId){
  console.error("[credit] nenhuma fonte devolveu o id da entrada",{
   plan:req.plan,
   setupBytes:planPayload.length,
   setupHasForm:/pagamentos_ent/i.test(planPayload),
   setupHasIdAttribute:/data-(?:cdpagamento|item)/i.test(planPayload),
   variableBytes:variablePayload.length,
   variableHasForm:/pagamentos_ent/i.test(variablePayload),
   variableHasIdAttribute:/data-(?:cdpagamento|item)/i.test(variablePayload),
   rebuiltBytes:rebuiltPayload.length,
   rebuiltHasForm:/pagamentos_ent/i.test(rebuiltPayload),
   rebuiltHasIdAttribute:/data-(?:cdpagamento|item)/i.test(rebuiltPayload)
  });
  throw new Error(variableEntryError(req.plan,"PAYMENT_ID_NOT_FOUND"));
 }

 // 3) Preenche a entrada. A chamada abaixo é o evento disparado quando o
 // vendedor clica fora do campo (blur/change) no site da Plataforma Click.
 const entry=await browserAjaxGet(page,`${origin}/checkout_catalogo/processa_inclui_pagamento_variavel_ajax.php`,{
  cd_pagamento:paymentId,valor:formatBrazilianMoney(downPayment),_:String(Date.now())
 });
 if(!entry.ok)throw new Error(variableEntryError(req.plan,"VARIABLE_ENTRY_FAILED"));
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
 await chooseWarranty(page,Boolean(req.warranty));
 const baseRequiredProducts=await prepareBaseCreditCart(page,req.plan);
 const warranty=await applyTraditionalWarrantyService(page,req.code,Boolean(req.warranty));
 // Este total ainda não contém nenhum 849xxx e é a única base usada para
 // escolher a faixa, exatamente antes de incluir o produto prestamista.
 const prestamistaProduct=await preparePrestamistaBand(page,warranty.cartTotalAfterWarranty);
 const requiredProducts=[...baseRequiredProducts,prestamistaProduct];
 await enterCpfAndAdvanceTraditional(page,cpf);

 if(req.plan==="CT1"){
  return simulateCt1(page,req,{product,voltage,warranty,requiredProducts});
 }
 if(req.plan==="CT2"||req.plan==="48"){
  return simulateVariableEntry(page,req,{product,voltage,warranty,requiredProducts});
 }
 throw new Error("INVALID_PLAN");
}
