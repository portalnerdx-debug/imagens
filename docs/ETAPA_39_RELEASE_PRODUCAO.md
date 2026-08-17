# Etapa 39 — Release e verificação de produção

O projeto agora possui um fluxo final de publicação e verificação.

## Status
```powershell
npm run release:status
```

## Validação + deploy
```powershell
npm run release:full
```

Esse comando somente chega ao deploy se o diagnóstico, auditoria, variáveis, TypeScript e build passarem.

## Depois do Firebase Hosting
Copie exatamente a Hosting URL retornada pelo Firebase e execute:
```powershell
npm run verify:production -- https://SEU_SITE.web.app
```

São verificados:
- página principal;
- fallback SPA;
- rota pública de comparação;
- resposta HTML do Hosting.

## Limite desta etapa
A publicação real não pode ser marcada como concluída sem a saída real do Firebase CLI autenticado na conta do usuário. Nenhuma URL de produção é inventada.

## Próximo passo
Depois que o deploy estiver no ar, fazer o teste funcional completo: autenticação, pesquisa de produto, crediário, fechamento, Firestore, aprendizado, QR e funcionamento em celular.
