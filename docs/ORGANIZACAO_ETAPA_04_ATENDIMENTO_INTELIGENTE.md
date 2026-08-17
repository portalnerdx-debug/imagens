# Organização — Etapa 4: Atendimento Inteligente

Esta etapa transforma o início do atendimento em uma ficha curta que alimenta orientação contextual durante toda a venda.

## O que foi adicionado

- Prioridade do cliente: preço, qualidade, recursos, parcela ou durabilidade.
- Preferência de pagamento: Pix/à vista, cartão, crediário ou indefinido.
- Momento de compra: comprar hoje, pesquisando ou apenas orçamento.
- Pergunta sugerida adaptada à etapa e ao perfil informado.
- Plano rápido da venda com próximo passo, direção de produto, argumento, complemento e objeção provável.
- Sugestões de venda complementar por categoria detectada no objetivo do cliente.
- Resumo lateral com prioridade e pagamento quando informados.
- Layout responsivo para os novos controles e cards.

## Arquivos principais

- `apps/web/src/SmartSaleGuide.ts`
- `apps/web/src/SmartAttendanceGuide.tsx`
- `apps/web/src/main.tsx`
- `apps/web/src/styles.css`

## Validação

A lógica pura de `SmartSaleGuide.ts` foi validada com TypeScript global. O typecheck completo do app não pode ser concluído neste ambiente porque o pacote recebido não contém `node_modules`; os erros globais resultantes são de módulos/tipos ausentes como React/Firebase.
