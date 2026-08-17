# Etapa 8.21 — sessão nova como recuperação do carrinho

O XVendas mantém a limpeza AJAX como caminho principal. Se a Plataforma Click
continuar informando itens depois das exclusões, a operação é interrompida e o
backend executa automaticamente este fluxo:

1. fecha o navegador da tentativa que falhou;
2. faz um novo login seguro usando as variáveis do Render;
3. grava uma sessão Click nova;
4. abre outro contexto de navegador;
5. repete a simulação completa uma única vez.

Erros diferentes de sessão expirada ou carrinho não zerado não provocam novos
logins. Isso evita repetição infinita e reduz o risco de vários acessos
desnecessários à Plataforma Click.
