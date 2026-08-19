# Etapa 8.25 — identificador da entrada Cliente Novo 48

O HAR 9 confirmou que a chamada
`processa_inclui_pagamento_ajax.php?cod_pagto=48` já devolve o identificador
dinâmico da entrada dentro do campo JSON `html`.

No fluxo capturado, a entrada usou `data-cdpagamento="12202282"` e a parcela
financiada usou `12202283`. O XVendas agora restringe a leitura ao formulário
`pagamentos_ent` e captura o primeiro número, evitando usar o id da parcela.

Ordem executada:

1. incluir a condição Cliente Novo 48;
2. guardar o id da entrada retornado no JSON;
3. ativar Entrada Variável;
4. enviar o valor pelo id guardado;
5. recarregar e extrair o resultado da simulação.

A leitura do HTML recarregado continua disponível como fallback.
