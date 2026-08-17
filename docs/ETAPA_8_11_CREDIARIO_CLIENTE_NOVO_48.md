# Etapa 8.11 — Crediário Cliente Novo (código 48)

Fluxo confirmado no HAR da Plataforma Click:

1. Adicionar o produto principal e selecionar a garantia.
2. Preparar os produtos obrigatórios: `447157` (1 unidade) e `801911` (3 unidades).
3. Se o produto principal custar mais de R$ 2.500,00, adicionar também `849081` (1 unidade).
4. Enviar o CPF e abrir `carrinho-entrega.php?reload=sim`.
5. Selecionar `cod_pagto=48` com 2 a 24 pagamentos totais.
6. Marcar a entrada variável, recarregar a página, capturar o identificador dinâmico do pagamento e informar a entrada.
7. Recarregar novamente para capturar o total da entrada, a quantidade e o valor das parcelas financiadas.

O código `48` identifica a condição Cliente Novo. Ele não significa 48 parcelas. A tela observada oferece até 23 parcelas financiadas; com a entrada, são até 24 pagamentos totais.

Antes de preparar esse carrinho, o robô retira explicitamente o código tradicional `447164` que possa ter permanecido na sessão. Esse produto nunca integra o plano Cliente Novo 48.

O preenchimento da entrada reproduz o evento de saída do campo usado pelo site, chamando `processa_inclui_pagamento_variavel_ajax.php` somente após a página ter sido atualizada e o identificador dinâmico ter sido obtido.

O robô encerra a operação na simulação e não confirma compra nem pedido.
