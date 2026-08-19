# Etapa 8.24 — novo login em cada consulta de crediário

O carrinho da Plataforma Click pertence à sessão. Como a exclusão dos itens
anteriores não era confirmada de forma confiável, a consulta de crediário não
tenta mais limpar esse carrinho.

O novo fluxo é:

1. criar um login e uma sessão Click novos;
2. pesquisar o produto;
3. adicionar produto, garantia e itens auxiliares;
4. consultar a condição de crediário;
5. encerrar o contexto da consulta.

Se a sessão expirar durante a execução, o backend cria outra sessão e repete a
operação apenas uma vez. `CLICK_USERNAME` e `CLICK_PASSWORD` continuam somente
nas variáveis de ambiente secretas do Render.
