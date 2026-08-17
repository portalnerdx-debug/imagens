# Etapa 38 — Deploy assistido

Esta etapa transforma o processo de publicação em um diagnóstico guiado.

## 1. Diagnóstico
```powershell
npm run deploy:doctor
```

Ele verifica:
- Node.js;
- npm;
- Firebase CLI;
- `node_modules`;
- `apps/web/.env`;
- `.firebaserc`.

## 2. Validação completa
```powershell
npm run release:check
```

Executa estrutura, auditoria de fonte, Firebase ENV, TypeScript e build. Um relatório é salvo em:

`reports/release-check.md`

Se uma etapa falhar, o processo para exatamente naquele ponto.

## 3. Deploy
Somente depois de o check passar:
```powershell
npm run release:deploy
```

## 4. Teste pós-deploy
Use a URL que o Firebase realmente retornar:
```powershell
npm run smoke:hosting -- https://SEU_SITE.web.app
```

## Importante
Nenhum deploy foi fingido nesta etapa. A publicação real depende de `firebase login`, do projeto selecionado em `.firebaserc` e das variáveis reais do Firebase Web App.
