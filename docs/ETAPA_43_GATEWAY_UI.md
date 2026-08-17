# Etapa 43 — Pesquisa e Crediário conectados ao Gateway

Implementado:
- Pesquisa Rápida chama `lookupClickProduct`;
- Crediário chama `simulateClickCredit`;
- estados de carregamento;
- mensagens amigáveis para não autenticado, integração ausente e entrada inválida;
- CT2 exige entrada;
- CPF é mantido apenas no estado temporário da tela e enviado à Function;
- resposta exibida é a resposta recebida do backend, não um cálculo inventado.

## Estado atual
O fluxo Web → Firebase Function está ligado. O `ClickAdapter` da Function continua propositalmente sem uma integração externa real até existir um método oficialmente autorizado para a Plataforma Click.

## Próxima etapa
Normalizar as respostas do adapter em tipos próprios de Produto e Simulação, para a interface mostrar uma ficha bonita em vez de JSON bruto e ficar pronta para receber a integração real.
