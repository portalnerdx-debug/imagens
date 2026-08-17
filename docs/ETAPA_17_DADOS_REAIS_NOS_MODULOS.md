# Etapa 17 — Dados reais nos módulos de venda

Implementado:
- contexto compartilhado dos produtos pesquisados;
- produtos capturados pelo robô passam a ficar disponíveis aos módulos;
- Montador/Calculadora usando preços capturados;
- alerta quando o orçamento é ultrapassado;
- Batalha de Produtos usando preço e estoque capturados;
- produtos sem estoque são bloqueados na montagem;
- sugestões consideram somente produtos já pesquisados e disponíveis;
- diferença de preço calculada automaticamente.

## Regra importante
O XVendas continua sem inventar dados. Um produto com estoque ou preço não capturado é identificado dessa forma.

## Limitação atual
A Venda Combinada ainda só pode sugerir entre os produtos que já foram pesquisados nesta sessão. Para recomendar automaticamente produtos complementares do catálogo inteiro, precisaremos construir um catálogo/indexação própria ou uma fonte autorizada de produtos.

## Próxima etapa
Criar **Catálogo Local Inteligente no Firestore**:
- guardar produtos já consultados;
- atualizar preço/estoque por data;
- pesquisar sem abrir o site para cada consulta quando houver cache recente;
- histórico de preço;
- base para aprender combos reais.
