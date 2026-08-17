# Etapa 8.23 — login e limpeza resilientes no Render

Esta etapa corrige o encadeamento observado em produção: o produto `990615`
permanecia no carrinho, a recuperação criava uma sessão nova e o login era
declarado como falho antes de a Plataforma Click terminar de responder.

## Login

- aguarda até 20 segundos depois do envio no ambiente mais lento do Render;
- procura o formulário também em frames;
- aceita seletores adicionais de usuário e botão `submit`;
- tenta abrir a tela de login quando a página inicial mostra apenas o link;
- não salva uma página incompleta como sessão autenticada;
- continua interrompendo CAPTCHA, MFA ou código interativo.

## Carrinho

- mantém o reset de pagamentos antes da exclusão;
- tenta primeiro a rota AJAX, que é o caminho mais rápido;
- se o item continuar presente, abre a tela e clica no botão real de exclusão;
- aceita automaticamente uma confirmação nativa, quando existir;
- confirma vazio apenas por contador zero ou mensagem explícita da página;
- nunca adiciona o novo produto enquanto um código antigo continuar presente.

As credenciais permanecem apenas nas variáveis `CLICK_USERNAME` e
`CLICK_PASSWORD` do Render e não são gravadas no repositório.
