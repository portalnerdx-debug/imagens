# Etapa 47 — Homologação real

A aplicação está preparada para homologação, mas uma integração externa só pode ser aprovada depois de ser executada contra um método oficialmente autorizado da Plataforma Click.

## A. Antes de testar
1. `npm install`
2. `npm --prefix functions install`
3. `firebase login`
4. `firebase use --add`
5. configurar `apps/web/.env`
6. configurar a URL oficial/autorizada usada pelo `CLICK_API_BASE_URL`
7. cadastrar o segredo:
   `firebase functions:secrets:set CLICK_API_TOKEN`

Não grave login, senha, CPF ou token em arquivos versionados.

## B. Validação local
```powershell
npm run test:click
npm run check:all
npm run homologation:doctor
```

## C. Deploy de homologação
```powershell
firebase deploy --only functions,firestore:rules,firestore:indexes,hosting
```

## D. Fluxo real obrigatório
Com uma conta de teste autorizada:
- pesquisar um código conhecido;
- confirmar nome/preço/estoque retornados;
- testar produto sem voltagem;
- testar produto 110/220 quando aplicável;
- testar sem garantia;
- testar Cliente Novo / 48;
- testar CT1 sem entrada;
- testar CT2 com entrada variável;
- testar 10 parcelas;
- comparar parcela, entrada e total com a própria Plataforma Click;
- testar erro de CPF;
- testar produto inexistente;
- confirmar que CPF/token não aparecem no Firestore, URL, logs do frontend ou histórico.

## E. Critério de aprovação
A integração só recebe status APROVADA quando os resultados do XVendas coincidirem com os resultados autorizados da Plataforma Click nos casos testados.

## Bloqueio atual
Sem a documentação/contrato oficial e uma credencial de teste autorizada, esta etapa fica tecnicamente PRONTA PARA HOMOLOGAR, mas não pode ser declarada como homologada.
