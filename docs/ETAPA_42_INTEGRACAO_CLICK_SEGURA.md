# Etapa 42 — Camada segura de integração com a Plataforma Click

Criada a arquitetura para que o navegador nunca receba as credenciais da Plataforma Click.

## Arquitetura
XVendas Web → Firebase Callable Function → `ClickAdapter` → integração oficialmente autorizada da Plataforma Click.

Foram criadas:
- `lookupClickProduct`;
- `simulateClickCredit`;
- autenticação obrigatória via Firebase Auth;
- validação de código, plano, parcelas, entrada e CPF;
- região `southamerica-east1`;
- `ClickGateway.ts` no frontend;
- adaptador isolado `functions/src/clickAdapter.ts`.

## Segurança
Não coloque login/senha da Plataforma Click em:
- `.env` com prefixo `VITE_`;
- React;
- Firestore;
- Git;
- localStorage.

O CPF é enviado à função somente quando necessário à consulta e não é persistido por este módulo.

## Ponto que falta
`ClickAdapter` permanece propositalmente sem automação de login. Para implementar a consulta real, precisamos usar uma API/integração autorizada pela Plataforma Click ou um método expressamente permitido pelo serviço. O sistema não contorna CAPTCHA, MFA ou proteções anti-bot.

## Instalação
```powershell
npm install
npm --prefix functions install
npm run check:all
```

Depois, com o Firebase configurado:
```powershell
npm run deploy:functions
```
