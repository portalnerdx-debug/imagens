# Etapa 37 — Homologação Firebase

Esta etapa prepara o primeiro deploy real sem adivinhar credenciais ou o Project ID.

## 1. Instalar
```powershell
npm install
npm install -g firebase-tools
```

## 2. Configurar Firebase Web App
Copie:
```powershell
Copy-Item apps/web/.env.example apps/web/.env
```
Preencha `apps/web/.env` com as configurações públicas do seu Firebase Web App.

Nunca coloque service-account, private key, senha da Plataforma Click ou CPF nesse arquivo.

## 3. Login e projeto
```powershell
firebase login
firebase projects:list
firebase use --add
```
Escolha o projeto correto. O arquivo `.firebaserc.example` mostra o formato esperado, mas o sistema não escolhe um projeto sozinho.

## 4. Homologar localmente
```powershell
npm run homologate
```
Isso executa:
- validação estrutural;
- auditoria de fonte;
- validação do `.env`;
- typecheck;
- build.

## 5. Testar emuladores
```powershell
npm run firebase:emulators
```

## 6. Primeiro deploy
```powershell
npm run deploy:homolog
```

## 7. Testar o endereço publicado
Depois que o Firebase informar a URL:
```powershell
npm run smoke:hosting -- https://SEU_SITE.web.app
```

## Observação importante
O deploy real não foi executado automaticamente nesta etapa porque exige autenticação na sua conta Firebase e a escolha explícita do projeto correto.
