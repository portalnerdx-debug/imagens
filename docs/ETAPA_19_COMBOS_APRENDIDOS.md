# Etapa 19 — Combos Aprendidos + Venda Cruzada

Implementado:
- registro de cestas/vendas com vários produtos;
- armazenamento em `/users/{uid}/saleBaskets`;
- cálculo de coocorrência entre produtos;
- confiança: percentual das vendas do produto A em que B também apareceu;
- ranking de padrões;
- recomendação de venda cruzada a partir do item selecionado;
- combinação de sinais quando vários itens já estão na cesta.

## Exemplo
Se o produto A apareceu em 10 vendas e em 6 delas o produto B também apareceu, a associação A → B terá confiança de 60%.

## Importante
A recomendação serve para lembrar oportunidades. Ela não substitui a descoberta da necessidade do cliente.

## Próxima etapa
Adicionar:
- categorias e famílias de produtos;
- aprendizado mesmo quando códigos/modelos mudam;
- cadeia de venda cruzada (Fogão → Armário → Mesa);
- filtros por estoque e orçamento.
