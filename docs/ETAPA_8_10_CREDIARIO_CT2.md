# Etapa 8.10 — Crediário tradicional com entrada (CT2)

## Fluxo confirmado pelo HAR

1. Preparar o mesmo carrinho do CT1, incluindo produtos obrigatórios e garantia.
2. Enviar o CPF e abrir a tela de pagamentos.
3. Selecionar `CT2` com 2 a 24 pagamentos totais.
4. Ativar a opção **Entrada Variável**.
5. Recarregar e localizar o identificador dinâmico da linha de entrada.
6. Enviar a entrada em formato brasileiro (`500,00`). Essa chamada corresponde ao evento disparado quando o vendedor preenche o campo e clica fora dele.
7. Recarregar e capturar entrada, quantidade real de parcelas, valor da parcela, total parcelado e total geral.

## Composição dos pagamentos

No CT2, a quantidade selecionada inclui a entrada. Assim, 11 pagamentos correspondem a:

- 1 entrada;
- 10 parcelas financiadas.

Exemplo confirmado:

- entrada: R$ 500,00;
- parcelas: 10x de R$ 510,09;
- total parcelado: R$ 5.100,89;
- total geral: R$ 5.600,89.

O XVendas também valida o valor mínimo de entrada calculado pela Plataforma Click e interrompe a consulta quando a entrada informada é menor.

## Segurança

A automação para depois da simulação. Nenhum pedido ou compra é confirmado.
