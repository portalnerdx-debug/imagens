# Etapa 13 — Firebase, autenticação e persistência

## O que entrou
- Firebase SDK no front-end;
- Firebase Auth;
- login por e-mail/senha;
- criação de conta;
- login Google;
- observação automática da sessão;
- Firestore;
- camada `CloudStore.ts`;
- regras que isolam dados por UID;
- configuração de Firebase Hosting;
- `.env.example`.

## 1. Criar/usar projeto Firebase
No Console Firebase, abra o projeto que hospedará o XVendas.

Ative:
- Authentication → Sign-in method → Email/Password;
- Authentication → Sign-in method → Google (se desejar);
- Firestore Database.

## 2. Configurar aplicativo Web
Em Project settings → Your apps, crie/abra o aplicativo Web e copie os valores da configuração.

Dentro de `apps/web`, copie:
`.env.example` → `.env`

Preencha as seis variáveis `VITE_FIREBASE_*`.

Não coloque senha de usuário, chave privada de service account ou arquivo Admin SDK no front-end.

## 3. Instalar e testar
Na raiz:
```powershell
npm install
npm run dev:web
```

## 4. Regras
Antes de produção, revise as regras. O modelo desta etapa permite ao usuário autenticado acessar somente `/users/{seuUid}/...`.

Deploy:
```powershell
firebase login
firebase use --add
firebase deploy --only firestore:rules,firestore:indexes
```

## 5. Build e Hosting
```powershell
npm run build
firebase deploy --only hosting
```

## Estado desta etapa
A autenticação e a camada Firestore estão implementadas. Os módulos existentes ainda mantêm parte do estado local para não quebrar o protótipo. Nas próximas etapas, cada módulo será migrado gradualmente para `CloudStore`, começando por atendimentos, resultados e aprendizado.
