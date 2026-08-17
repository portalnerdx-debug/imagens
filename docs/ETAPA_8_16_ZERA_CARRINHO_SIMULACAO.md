# Etapa 8.16 — carrinho zerado antes de cada simulação

Antes de iniciar qualquer CT1, CT2 ou Cliente Novo 48, o robô agora:

1. abre o carrinho associado à sessão da Plataforma Click;
2. identifica todos os códigos de produtos existentes;
3. exclui cada item, incluindo o produto principal, adicionais e garantia;
4. repete a leitura caso ainda exista algum item;
5. confirma que o contador do carrinho chegou a zero;
6. remove a condição de pagamento/entrada variável anterior;
7. somente então pesquisa e adiciona os produtos da nova simulação.

Se a Plataforma Click não confirmar a limpeza, a simulação para com
`CART_CLEANUP_FAILED`, evitando apresentar parcelas calculadas sobre produtos
de uma consulta anterior.

## Publicação

O código do robô precisa ser enviado ao repositório usado pelo Render. Com o
deploy automático ativado, o Render publicará a atualização após o commit.

Depois, publique também o frontend atualizado:

```bat
npm install
npm run build
firebase deploy --only hosting --project vendas-211b4
```
