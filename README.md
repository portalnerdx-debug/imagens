# XVendas 1.0.1 — Backend Playwright

Esta atualização mantém o Firebase no plano Spark e move a automação da Plataforma Click para um backend Playwright separado.

Incluído:
- login automático por credenciais secretas do backend;
- sessão Playwright;
- pesquisa por código;
- fluxo de crediário 48 / CT1 / CT2;
- entrada variável no Cliente Novo 48 e no CT2;
- carrinho Cliente Novo com `447157` (1x), `801911` (3x) e `849081` acima de R$ 2.500,00;
- voltagem somente quando solicitada;
- sem garantia por padrão;
- CPF opcional no backend;
- autenticação do backend com Firebase ID Token;
- CORS restrito;
- Dockerfile;
- bloqueio de confirmação final de compra;
- sem bypass de CAPTCHA/MFA.

Leia `docs/BACKEND_PLAYWRIGHT.md`.

Para executar o robô gratuitamente fora do computador, use o Blueprint `render.yaml` e siga `docs/ETAPA_8_13_RENDER_GRATUITO.md`.

O plano Cliente Novo usa o código de pagamento `48` e permite de 2 a 24 pagamentos totais: 1 entrada variável e até 23 parcelas financiadas. O fluxo detalhado está em `docs/ETAPA_8_11_CREDIARIO_CLIENTE_NOVO_48.md`.

### Diagnóstico do robô no Windows

Depois de configurar `apps/robot/.env`, execute:

```bat
npm run robot:login
```

O resultado esperado é `Sessão automática salva com sucesso.`. Em seguida, confirme que `apps\\robot\\playwright\\.auth\\click.json` foi criado e execute `npm run robot:dev`.

Se uma consulta de produto retornar HTTP 500, o terminal do `robot:dev` agora exibe o erro técnico real com o prefixo `[GET /api/products/<codigo>]`.
