# Organização — Etapa 8: condições de pagamento da Plataforma Click

## Objetivo
Ligar a consulta de produto da Etapa 7 ao simulador seguro de crediário já existente no backend.

## Alterações
- Criado `ClickPaymentConditions.tsx`.
- O produto consultado na Plataforma Click passa a oferecer simulação logo abaixo do resultado.
- Planos disponíveis: Cliente Novo (48), CT1 sem entrada e CT2 com entrada.
- Atalhos de parcelas: 1, 2, 3, 5, 6, 8, 10 e 12.
- Entrada aparece somente para CT2.
- Voltagens detectadas no produto são reutilizadas na simulação.
- Garantia adicional permanece opcional.
- CPF é solicitado apenas no momento da consulta e não é persistido pelo componente.
- Resultado exibe entrada, número de parcelas, valor da parcela e total apenas quando capturados pelo backend.
- O frontend continua usando `ClickGateway`, portanto a chamada leva o token Firebase.

## Segurança
O fluxo usa o endpoint `/api/credit/simulate`, que interrompe a automação antes de qualquer confirmação final de compra. A senha e os cookies da Plataforma Click permanecem no backend.
