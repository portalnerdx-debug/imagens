# XVendas 1.0 — Checklist final

## Código
- [x] Estrutura modular consolidada
- [x] Auditoria de fonte sem erros
- [x] Testes automatizados Click 11/11
- [x] E2E estrutural aprovado
- [x] Firestore Rules e Hosting configurados
- [x] Firebase Functions preparadas
- [x] CPF fora do histórico de aprendizado
- [x] Credenciais externas fora do frontend

## Para colocar no ar no seu ambiente
- [ ] `npm install`
- [ ] `npm --prefix functions install`
- [ ] configurar `apps/web/.env`
- [ ] `firebase login`
- [ ] `firebase use --add`
- [ ] `npm run v1:verify`
- [ ] `npm run v1:gate`
- [ ] configurar API/segredo Click oficialmente autorizados
- [ ] executar protocolo da Etapa 47
- [ ] `npm run v1:release`
- [ ] executar `verify:production` na URL retornada
- [ ] testar em celular real

## Regra de liberação
O pacote é a versão de código **1.0.0**. A implantação em produção só deve ser considerada concluída depois que os itens dependentes do Firebase real e da integração autorizada forem executados com sucesso.
