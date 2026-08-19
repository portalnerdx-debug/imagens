# Etapa 8.23 — correção da renovação automática da sessão

A Plataforma Click usa um formulário AJAX cujo botão é identificado apenas
como `OK`. A renovação anterior procurava botões chamados Entrar, Login ou
Acessar e podia validar a sessão antes de o AJAX terminar.

O backend agora envia as credenciais secretas do Render ao mesmo endpoint do
formulário, aguarda a resposta e só salva a sessão depois de confirmar o código
de sucesso e a saída da tela de login.

As credenciais continuam exclusivamente em `CLICK_USERNAME` e
`CLICK_PASSWORD` no Render. O retry permanece limitado a uma repetição. O fluxo
continua: resetar pagamento, planos e entrada; excluir itens; confirmar carrinho
vazio; adicionar produto e auxiliares; consultar crediário.
