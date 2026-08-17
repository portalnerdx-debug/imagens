# Etapa 46 — Testes automatizados da integração

Adicionados testes para:
- normalização de produto;
- normalização de crediário;
- rejeição de resposta financeira incompleta;
- validação de código de produto;
- validação básica de CPF (11 dígitos);
- CT1 sem entrada;
- CT2 exigindo entrada;
- limite de 1–48 parcelas;
- API mock retornando sucesso, 401 e 429.

Os testes não acessam a Plataforma Click real e não usam credenciais.

## Executar
```powershell
npm --prefix functions install
npm run test:click
npm run integration:check
```

## Próxima etapa
Etapa 47: homologação real com conta/integração autorizada. Será necessário configurar o contrato oficial da API antes de marcar a integração externa como aprovada.
