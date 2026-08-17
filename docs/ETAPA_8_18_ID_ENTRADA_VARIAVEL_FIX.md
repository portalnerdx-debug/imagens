# Etapa 8.18 — identificador da entrada variável

Corrige o timeout ao procurar o identificador dinâmico usado para preencher a
entrada nos planos CT2 e Cliente Novo 48.

O robô agora:

1. verifica se cada seletor existe antes de ler atributos;
2. procura primeiro `data-cdpagamento` dentro de `pagamentos_ent`;
3. aceita os formatos alternativos `data-item` usados pela Plataforma Click;
4. ignora códigos curtos da condição, como `1`, que não são ids de pagamento;
5. analisa o HTML como alternativa ao seletor visual;
6. recarrega a página uma vez se o conteúdo dinâmico ainda não apareceu;
7. retorna `CT2_PAYMENT_ID_NOT_FOUND` ou `48_PAYMENT_ID_NOT_FOUND` sem esperar
   o timeout genérico de 30 segundos.

O fluxo CT1 não é alterado.
