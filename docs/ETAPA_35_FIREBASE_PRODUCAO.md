# Etapa 35 — Preparação para produção no Firebase

Incluído:
- configuração completa de Firestore Rules e Indexes no `firebase.json`;
- regras isolando todos os dados privados por `uid`;
- regra pública temporária preparada para comparações com expiração;
- validação estrutural antes do deploy;
- scripts de typecheck, build e deploy;
- emuladores de Firestore e Hosting;
- cache longo para assets e `no-cache` para `index.html`.

## Comandos

```bash
npm install
npm run check
firebase login
firebase use --add
npm run deploy
```

Para testar localmente:

```bash
npm run firebase:emulators
```

## Antes de publicar
Crie `apps/web/.env` a partir de `.env.example` e preencha somente as configurações públicas do Firebase Web App. Não coloque senha da Plataforma Click, CPF padrão, service-account JSON ou qualquer segredo no frontend.

## Observação sobre índices
As consultas atuais usam principalmente subcoleções do próprio usuário com `orderBy(createdAtMs)`. Os índices automáticos de campo único do Firestore atendem esse desenho, portanto nenhum índice composto adicional é necessário nesta etapa.
