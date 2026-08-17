# Etapa 8.17 — produto prestamista por faixa

A regra é aplicada a CT1, CT2 e Cliente Novo 48 usando o total real do carrinho
sem nenhum produto da família `849xxx`:

| Total antes do prestamista | Código incluído |
| --- | --- |
| Até R$ 1.000,00 | `849043` |
| R$ 1.000,01 a R$ 1.500,00 | `849050` |
| R$ 1.500,01 a R$ 2.000,00 | `849067` |
| R$ 2.000,01 a R$ 2.500,00 | `849074` |
| Acima de R$ 2.500,00 | `849081` |

## Ordem aplicada pelo robô

1. zera o carrinho e o pagamento anterior;
2. adiciona o produto principal;
3. adiciona `447164` ou `447157` e três unidades de `801911`;
4. aplica a escolha de garantia;
5. lê o total do carrinho, ainda sem qualquer `849xxx`;
6. remove preventivamente os cinco códigos de faixa;
7. inclui exatamente uma unidade do código correspondente ao total;
8. continua a simulação de parcelas.

O preço do produto de faixa não é enviado pelo XVendas. A Plataforma Click usa
o preço oficial associado ao código escolhido.
