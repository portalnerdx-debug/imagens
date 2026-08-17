# Etapa 8.5 — Crediário tradicional sem entrada (CT1)

## Fluxo confirmado

1. Localizar o produto e adicioná-lo ao carrinho.
2. Selecionar voltagem e garantia quando o produto exigir.
3. Preparar os produtos auxiliares obrigatórios e suas quantidades.
4. Informar o CPF e avançar até a tela de entrega/pagamento.
5. Solicitar a condição `CT1` com a quantidade escolhida, de 1 a 24 parcelas.
6. Recarregar a tela de pagamento e extrair a linha no formato `12x R$ 494,05`.
7. Extrair o total no formato `Total: R$ 5.928,60`.
8. Encerrar sem confirmar compra ou concluir pedido.

## Produtos auxiliares obrigatórios

Antes de informar o CPF, o carrinho CT1 é ajustado para conter:

- 1 unidade do código `447164`;
- 3 unidades do código `801911`;
- 1 unidade do código `849081` apenas quando o produto principal custar mais de R$ 2.500,00.

As quantidades são fixadas pelo endpoint de quantidade observado no fluxo real. Se o preço do produto principal não tiver sido confirmado, a consulta é interrompida para não aplicar incorretamente a regra de R$ 2.500,00.

## Segurança

- O CPF permanece apenas na consulta transitória do backend.
- O XVendas não inclui CPF em histórico, cache de produto ou aprendizado.
- A automação não executa botões de confirmar compra, concluir pedido ou efetuar compra.

No CT1, o CPF é enviado pelo mesmo fluxo observado no HAR (`processa_loginc.php`, pessoa física). Em seguida, o robô abre a tela de entrega/pagamento diretamente, sem depender do texto visual de botões que varia entre sessões.

## Confirmação da garantia no carrinho

Depois de preparar os produtos obrigatórios, o CT1 confirma a garantia pelo serviço real do carrinho:

- com garantia: `cd_servico=831055`;
- sem garantia: `cd_servico=0`;
- produto vinculado: código do produto principal (`cd_itprodd`).

O retorno precisa conter o novo total do carrinho. Se a Plataforma Click não devolver um total válido, a consulta é interrompida para não afirmar que a garantia foi aplicada.
