# Etapa 18 — Catálogo Inteligente + Cache + Histórico

Implementado:
- produtos consultados são armazenados no Firestore por usuário;
- cache de 30 minutos;
- pesquisa inteligente: cache primeiro, site depois;
- botão para forçar atualização ao vivo;
- histórico quando preço ou estoque muda;
- catálogo dos últimos produtos consultados;
- produtos do catálogo podem ser enviados para os módulos de orçamento/comparação;
- consultas feitas pelo painel de preço também alimentam o catálogo.

Estrutura:
`/users/{uid}/productCatalog/{codigo}`
`/users/{uid}/productCatalog/{codigo}/history/{registro}`

O cache reduz consultas repetidas ao site. Para informações críticas de venda, use **Forçar atualização** antes de confirmar preço/estoque ao cliente.

Próxima etapa:
**Combos Aprendidos pelas Vendas + Venda Cruzada Inteligente**, usando o histórico real para descobrir quais categorias/produtos aparecem juntos.
