# XVendas — Organização visual, etapa 2

## Objetivo
Transformar a tela de atendimento em uma interface de aplicativo, reduzindo a poluição visual sem alterar a lógica dos módulos de venda.

## Alterações
- Menu lateral para as seis áreas no desktop.
- Navegação horizontal compacta no celular.
- Faixa de contexto com área, etapa, orçamento e quantidade de anotações.
- Ferramentas agrupadas em blocos expansíveis por finalidade.
- Ações de avançar e voltar mantidas visíveis durante a rolagem.
- Resumo do cliente e próxima ação mantidos em painel contextual.
- Ajustes responsivos para desktop, tablet e celular.

## Arquivos alterados
- apps/web/src/main.tsx
- apps/web/src/styles.css

## Validação
A estrutura TSX foi revisada estaticamente. O build completo não pôde ser executado porque as dependências não estavam instaladas no pacote e `npm ci` não concluiu no ambiente de execução.
