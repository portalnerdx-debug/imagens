import test from "node:test";
import assert from "node:assert/strict";
import {
  parseCurrentPrice,
  parseStock,
  productNameFromText
} from "../src/productSearch.ts";
import {extractCreditResult,formatBrazilianMoney,parseCt2MinimumEntry} from "../src/creditResultParser.ts";
import {
 baseRequiredItemsForPlan,ct1RequiredItems,PRESTAMISTA_CODES,
 prestamistaItemForTotal,requiredItemsForPlan
} from "../src/ct1CartRules.ts";
import {chooseWarrantyHref} from "../src/warrantySelection.ts";
import {parseWarrantyCartTotal,warrantyServiceCode} from "../src/warrantyService.ts";
import {clearCreditCart,parseCartItemCount,parseCartProductCodes} from "../src/cartCleanup.ts";
import {parsePaymentEntryId,parsePaymentEntryIdPayload} from "../src/paymentEntryId.ts";
import {runWithSessionRetry} from "../src/sessionRetry.ts";

const capturedProductText = `
Espremedor de Frutas Mondial 1,2L 30W Premium E-02 Preto 110V COD.: 412100
De R$ 99,88
Por R$ 79,90
Vendido e entregue por:
LOJAS GUAIBIM

Estoque
LG53: 5
CD 31: 0
CD131: 0
Mostruário: 1
Produto Reoperado: 0
`;

test("captura o preço vigente e ignora o preço anterior", () => {
  assert.equal(parseCurrentPrice(capturedProductText), 79.90);
});

test("captura a quantidade da filial sem confundir LG53 com 53 unidades", () => {
  assert.equal(parseStock(capturedProductText, "LG53"), 5);
});

test("captura o nome associado ao código, não o título genérico da aba", () => {
  assert.equal(
    productNameFromText(capturedProductText, "412100"),
    "Espremedor de Frutas Mondial 1,2L 30W Premium E-02 Preto 110V"
  );
});

test("interpreta o resultado CT1 real devolvido pela tela de pagamento", () => {
  const result=extractCreditResult(`
    Forma de pagamento
    CT1 - 24X C/J CN
    12x R$ 494,05
    Total: R$ 5.928,60
    Ainda resta R$ 5.928,60 a pagar
  `,{code:"1032123",plan:"CT1",installments:12});
  assert.equal(result.entry,0);
  assert.equal(result.installmentValue,494.05);
  assert.equal(result.total,5928.60);
});

test("prepara a base tradicional antes de escolher a faixa prestamista",()=>{
 assert.deepEqual(baseRequiredItemsForPlan("CT1").map(({code,quantity})=>({code,quantity})),[
  {code:"447164",quantity:1},
  {code:"801911",quantity:3}
 ]);
});

test("seleciona a faixa prestamista pelos limites exatos do total sem 849xxx",()=>{
 const cases=[
  [0,"849043"],[1000,"849043"],[1000.01,"849050"],[1500,"849050"],
  [1500.01,"849067"],[2000,"849067"],[2000.01,"849074"],[2500,"849074"],
  [2500.01,"849081"],[9000,"849081"]
 ];
 for(const [total,expected] of cases){
  assert.equal(prestamistaItemForTotal(total).code,expected,`total ${total}`);
 }
});

test("prepara os produtos do Cliente Novo 48 com exatamente uma faixa",()=>{
 const items=requiredItemsForPlan("48",2500);
 assert.equal(items.some(item=>item.code==="447164"),false);
 assert.deepEqual(items.map(({code,quantity})=>({code,quantity})),[
  {code:"447157",quantity:1},{code:"801911",quantity:3},{code:"849074",quantity:1}
 ]);
 for(const total of [800,1200,1700,2200,2700]){
  const selected=requiredItemsForPlan("48",total).filter(item=>PRESTAMISTA_CODES.includes(item.code));
  assert.equal(selected.length,1,`total ${total} deve possuir uma única faixa`);
 }
});

test("CT1 também inclui sempre uma única faixa prestamista",()=>{
 const items=ct1RequiredItems(1000.01);
 assert.deepEqual(items.map(({code,quantity})=>({code,quantity})),[
  {code:"447164",quantity:1},{code:"801911",quantity:3},{code:"849050",quantity:1}
 ]);
 assert.equal(items.filter(item=>PRESTAMISTA_CODES.includes(item.code)).length,1);
});

test("seleciona o link real da garantia adicional",()=>{
 const hrefs=[
  "/checkout_catalogo/carrinho.php?cod=1032123&acao=incluir&op_garantia=0",
  "/checkout_catalogo/carrinho.php?cod=1032123&acao=incluir&op_garantia=831055"
 ];
 assert.match(chooseWarrantyHref(hrefs,true),/op_garantia=831055/);
 assert.match(chooseWarrantyHref(hrefs,false),/op_garantia=0$/);
});

test("confirma o serviço de garantia usado no carrinho",()=>{
 assert.equal(warrantyServiceCode(true),"831055");
 assert.equal(warrantyServiceCode(false),"0");
 assert.equal(parseWarrantyCartTotal("R$ 5.854,40"),5854.40);
 assert.equal(parseWarrantyCartTotal("R$ 5.119,50"),5119.50);
});

test("interpreta entrada variável e parcelas do CT2 conforme o HAR",()=>{
 const result=extractCreditResult(`
  Entrada Variável (Mínimo R$ 231,97)
  1x R$ 500,00
  Total Entrada: R$ 500,00
  Financ./Parc.
  10x R$ 510,09
  Total Parcelas: R$ 5.100,89
 `,{code:"1032123",plan:"CT2",installments:11,downPayment:500});
 assert.equal(result.requestedInstallments,11);
 assert.equal(result.installments,10);
 assert.equal(result.entry,500);
 assert.equal(result.installmentValue,510.09);
 assert.equal(result.financedTotal,5100.89);
 assert.equal(result.total,5600.89);
 assert.equal(parseCt2MinimumEntry("Entrada Variável (Mínimo R$ 231,97)"),231.97);
 assert.equal(formatBrazilianMoney(500),"500,00");
});

test("interpreta Cliente Novo 48 com entrada variável conforme o HAR",()=>{
 const result=extractCreditResult(`
  Entrada Variável (Mínimo R$ 193,67)
  1x R$ 500,00
  Total Entrada: R$ 500,00
  10x R$ 549,82
  Total Parcelas: R$ 5.498,21
 `,{code:"1032123",plan:"48",installments:11,downPayment:500});
 assert.equal(result.requestedInstallments,11);
 assert.equal(result.installments,10);
 assert.equal(result.entry,500);
 assert.equal(result.installmentValue,549.82);
 assert.equal(result.financedTotal,5498.21);
 assert.equal(result.total,5998.21);
});

test("identifica todos os produtos que precisam ser removidos do carrinho",()=>{
 const html=`
  <span id="CarrinhoNumItens">6</span>
  <a href="/checkout_catalogo/carrinho.php?cod=1032123&amp;acao=excluir">Excluir</a>
  <a href="/checkout_catalogo/carrinho.php?acao=excluir&amp;cod=801911">Excluir</a>
  <div data-cod="447164">Cód.: 447164</div>
  <button onclick="removerProduto('849081')">Remover</button>
 `;
 assert.equal(parseCartItemCount(html),6);
 assert.deepEqual(parseCartProductCodes(html).sort(),["1032123","447164","801911","849081"].sort());
});

test("confirma carrinho vazio quando o contador chega a zero",()=>{
 assert.equal(parseCartItemCount('<span id="CarrinhoNumItens">0</span>'),0);
 assert.deepEqual(parseCartProductCodes('<span id="CarrinhoNumItens">0</span>'),[]);
});

test("captura o data-item do botão real de exclusão do carrinho",()=>{
 const html=`
  <span id="CarrinhoNumItens">2</span>
  <td class="col-excluir">
   <a href="javascript:;" data-item="412100" class="link-excluir ft24 ft700">×</a>
  </td>
  <a class="link-excluir" data-item="801911" href="javascript:;">×</a>
  <span data-item="12192523">id de pagamento que não é produto</span>
 `;
 assert.deepEqual(parseCartProductCodes(html).sort(),["412100","801911"]);
});

test("reseta o pagamento antes de excluir os produtos antigos",async()=>{
 const calls=[];
 let cartReads=0;
 const response=(body="")=>({ok:()=>true,text:async()=>body});
 const page={
  url:()=>"https://plataformaclick.com.br/",
  request:{get:async(url)=>{
   calls.push(url);
   if(url.includes("processa_reseta_pagtos.php"))return response();
   if(url.includes("carrinho_excluir_ajax.php"))return response('{"vl_total":"0,00"}');
   if(url.endsWith("/checkout_catalogo/carrinho.php")){
    cartReads++;
    return cartReads===1
     ? response('<span id="CarrinhoNumItens">1</span><a class="link-excluir" data-item="412100">×</a>')
     : response('<span id="CarrinhoNumItens">0</span>');
   }
   throw new Error(`URL inesperada: ${url}`);
  }}
 };
 const result=await clearCreditCart(page);
 assert.match(calls[0],/processa_reseta_pagtos\.php/);
 assert.match(calls[1],/checkout_catalogo\/carrinho\.php$/);
 assert.match(calls[2],/carrinho_excluir_ajax\.php$/);
 assert.equal(result.confirmedEmpty,true);
 assert.deepEqual(result.removedProducts,["412100"]);
});

test("captura data-cdpagamento da primeira entrada sem aguardar locator",()=>{
 const html=`
  <form name="pagamentos_ent" id="pagamentos_ent">
   <div><span data-item="1">Entrada</span></div>
   <div><select class="change-payment" data-item="1" data-cdpagamento="12192490"></select></div>
   <a class="remove-payment" data-item="12192490">Excluir</a>
   <select class="change-payment" data-cdpagamento="12192491"></select>
  </form>`;
 assert.equal(parsePaymentEntryId(html),"12192490");
});

test("usa data-item longo como alternativa e ignora o código curto da condição",()=>{
 const html=`
  <form id="pagamentos_ent">
   <span data-item="1">Código da condição</span>
   <a class="remove-payment" data-item="12192523">Excluir entrada</a>
  </form>`;
 assert.equal(parsePaymentEntryId(html),"12192523");
 assert.equal(parsePaymentEntryId('<form id="pagamentos_ent"><span data-item="1"></span></form>'),undefined);
});

test("captura o id da entrada Cliente Novo 48 direto do JSON observado no HAR 9",()=>{
 const payload=JSON.stringify({html:`
  <form name="pagamentos_ent" id="pagamentos_ent">
   <select class="change-payment" data-id="48" data-cdpagamento="12202282"></select>
   <a class="remove-payment" data-type="E" data-item="12202282">Excluir</a>
  </form>
  <form id="pagamentos_parc">
   <select class="change-payment" data-cdpagamento="12202283"></select>
  </form>
 `});
 assert.equal(parsePaymentEntryIdPayload(payload),"12202282");
});

test("captura o id mesmo quando o HTML vem aninhado em outra chave JSON",()=>{
 const payload=JSON.stringify({data:{resultado:{conteudo:`
  <form id="pagamentos_ent">
   <a class="remove-payment" data-type="E" data-item="12202282">Excluir</a>
  </form>
 `}}});
 assert.equal(parsePaymentEntryIdPayload(payload),"12202282");
});

test("renova a sessão expirada e repete a operação somente uma vez",async()=>{
 let attempts=0,refreshes=0;
 const result=await runWithSessionRetry(async()=>{
  attempts++;
  if(attempts===1)throw new Error("CLICK_SESSION_EXPIRED");
  return "ok";
 },async()=>{refreshes++});
 assert.equal(result,"ok");
 assert.equal(attempts,2);
 assert.equal(refreshes,1);
});

test("não cria sessão nova para erros que não sejam recuperáveis",async()=>{
 let refreshes=0;
 await assert.rejects(
  runWithSessionRetry(async()=>{throw new Error("PRODUCT_NOT_FOUND")},async()=>{refreshes++}),
  /PRODUCT_NOT_FOUND/
 );
 assert.equal(refreshes,0);
});

test("não tenta recuperar erro de limpeza porque o crediário usa sessão nova",async()=>{
 let refreshes=0;
 await assert.rejects(
  runWithSessionRetry(async()=>{throw new Error("CART_CLEANUP_FAILED")},async()=>{refreshes++}),
  /CART_CLEANUP_FAILED/
 );
 assert.equal(refreshes,0);
});
