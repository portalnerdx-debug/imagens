# Etapa 8.19 — renovação automática da sessão Click

Quando a Plataforma Click expira os cookies usados pelo Render, o backend
agora executa o seguinte fluxo:

1. identifica `CLICK_SESSION_EXPIRED`;
2. faz um novo login usando `CLICK_USERNAME` e `CLICK_PASSWORD` do Render;
3. salva a nova sessão sem expor as credenciais ao navegador do vendedor;
4. repete a pesquisa ou simulação completa uma única vez;
5. mantém o erro se a segunda tentativa também falhar.

Várias consultas simultâneas compartilham a mesma renovação. O arquivo antigo
só é substituído depois que o novo estado estiver pronto.

## Variáveis obrigatórias no Render

- `CLICK_USERNAME`
- `CLICK_PASSWORD`
- `CLICK_BASE_URL=https://plataformaclick.com.br`
- `CLICK_HEADLESS=true`

Se a Plataforma Click solicitar CAPTCHA, MFA ou código interativo, o robô para
com `CLICK_INTERACTIVE_CHALLENGE_REQUIRED`; ele não tenta contornar a proteção.
