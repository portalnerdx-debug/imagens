# Etapa 14 — Persistência real no Firestore

Implementado:
- atendimentos salvos por usuário;
- atualização de atendimento em andamento;
- marcação de venda fechada/perdida;
- objeções enviadas ao Firestore;
- vendas perdidas enviadas ao Firestore;
- resultados de vendas enviados ao Firestore;
- painel de sincronização com contagem dos registros em nuvem;
- funções de leitura/listagem no `CloudStore`.

Estrutura:
- `/users/{uid}/atendimentos/{id}`
- `/users/{uid}/sales/{id}`
- `/users/{uid}/objections/{id}`
- `/users/{uid}/lostSales/{id}`
- `/users/{uid}/private/progress`

Teste:
1. Configure `apps/web/.env`.
2. Ative Authentication e Firestore.
3. Faça deploy das regras.
4. Rode `npm install` e `npm run dev:web`.
5. Entre com sua conta.
6. Inicie um atendimento e use **Salvar atendimento**.
7. Registre objeções, perdas e resultados.
8. Clique em **Atualizar** no painel Firestore conectado.
