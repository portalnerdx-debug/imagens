# Etapa 8.20 — limpeza do carrinho pela rota AJAX real

A Plataforma Click não remove o produto por
`carrinho.php?acao=excluir`. A tela atual usa um botão `.link-excluir`,
guarda o código do produto em `data-item` e chama
`checkout_catalogo/carrinho_excluir_ajax.php`.

Antes de cada simulação CT1, CT2 ou Cliente Novo 48, o XVendas agora:

1. abre o carrinho autenticado;
2. captura todos os códigos nos botões reais de exclusão;
3. remove cada linha pela rota AJAX;
4. recarrega o carrinho;
5. só continua quando `CarrinhoNumItens` confirma zero;
6. limpa também a condição de pagamento anterior.

Isso impede que produtos, garantias ou pagamentos de uma consulta anterior
sejam somados à nova simulação.
