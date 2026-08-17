# Etapa 8.22 — reset de pagamento antes da limpeza do carrinho

A Plataforma Click mantém a condição de pagamento na mesma sessão do
carrinho. Quando ainda existe uma condição CT1, CT2 ou 48 ativa, uma tentativa
de excluir produto pode responder sem efetivamente liberar a linha.

O fluxo antes de cada simulação agora é:

1. resetar a condição de pagamento e a entrada anteriores;
2. abrir o carrinho;
3. remover todos os produtos antigos pela rota AJAX;
4. recarregar e confirmar `CarrinhoNumItens` igual a zero;
5. pesquisar e adicionar o produto atual;
6. adicionar somente os produtos auxiliares correspondentes ao plano atual;
7. executar a nova simulação.

Se a limpeza não for confirmada, o backend cria uma sessão autenticada nova e
repete o fluxo completo uma única vez.
