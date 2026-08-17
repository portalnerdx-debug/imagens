import test from "node:test";
import assert from "node:assert/strict";
import {
  parseCurrentPrice,
  parseStock,
  productNameFromText
} from "../src/productSearch.ts";
import {extractCreditResult,formatBrazilianMoney,parseCt2MinimumEntry} from "../src/creditResultParser.ts";
import {ct1RequiredItems,requiredItemsForPlan} from "../src/ct1CartRules.ts";
import {chooseWarrantyHref} from "../src/warrantySelection.ts";
import {parseWarrantyCartTotal,warrantyServiceCode} from "../src/warrantyService.ts";

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

test("prepara os produtos obrigatórios do CT1 até R$ 2.500",()=>{
 assert.deepEqual(ct1RequiredItems(2500).map(({code,quantity})=>({code,quantity})),[
  {code:"447164",quantity:1},
  {code:"801911",quantity:3}
 ]);
});

test("adiciona o seguro prestamista quando o produto passa de R$ 2.500",()=>{
 assert.deepEqual(ct1RequiredItems(2500.01).map(({code,quantity})=>({code,quantity})),[
  {code:"447164",quantity:1},
  {code:"801911",quantity:3},
  {code:"849081",quantity:1}
 ]);
});

test("prepara os produtos do Cliente Novo 48 conforme o HAR",()=>{
 const items=requiredItemsForPlan("48",2500);
 assert.equal(items.some(item=>item.code==="447164"),false);
 assert.deepEqual(items.map(({code,quantity,unitPrice})=>({code,quantity,unitPrice})),[
  {code:"447157",quantity:1,unitPrice:29.90},
  {code:"801911",quantity:3,unitPrice:59.90}
 ]);
 assert.deepEqual(requiredItemsForPlan("48",2500.01).map(({code,quantity})=>({code,quantity})),[
  {code:"447157",quantity:1},
  {code:"801911",quantity:3},
  {code:"849081",quantity:1}
 ]);
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
