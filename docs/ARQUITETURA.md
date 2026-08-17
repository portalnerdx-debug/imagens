# Arquitetura modular

- `apps/web`: interface do vendedor, destinada ao Firebase Hosting.
- `apps/api`: API principal para atendimentos, IA, metas, gamificação e histórico.
- `apps/robot`: Playwright isolado para a Plataforma Click.
- `packages/core`: tipos e regras compartilhadas.
- `packages/modules`: catálogo dos módulos e feature flags.

## Ordem de construção

1. Fundação: Modo Atendimento, Pesquisa de Produto, Simulador de Crediário, Ficha do Produto e Mapa da Conversa.
2. Copiloto: Próxima Melhor Ação, Pergunta Agora, Cliente Disse, Perfil, Chance de Fechamento, Detector e Salvar Venda.
3. Venda combinada: combos, venda cruzada, casa completa, orçamento e comparação.
4. Aprendizado: objeções, venda perdida, histórico e inteligência baseada nas próprias vendas.
5. Treinamento e desempenho: simuladores, avaliação, treinador, quiz, missões, gamificação, metas e painel.
6. Voz e compartilhamento: copiloto por voz e QR de comparação.

A automação de crediário deve ser somente de consulta/simulação e parar antes da confirmação definitiva de uma venda.
