# Backend Playwright — Plataforma Click

Esta versão move a integração da Plataforma Click para `apps/robot`, fora do Firebase Functions.

## Onde colocar login e senha

Crie:

`apps/robot/.env`

a partir de:

`apps/robot/.env.example`

Preencha **somente no backend**:

```env
CLICK_USERNAME=seu_login
CLICK_PASSWORD=sua_senha
```

Opcionalmente:

```env
CLICK_DEFAULT_CPF=00000000000
```

O CPF padrão também fica somente no backend e não é gravado pelo XVendas no Firestore.

Nunca coloque essas informações em `apps/web/.env`, variáveis `VITE_*`, GitHub ou Firestore.

## Segurança adicionada

O backend exige um Firebase ID Token válido. Portanto, somente um usuário autenticado no seu projeto `vendas-211b4` consegue chamar pesquisa/crediário.

Configure a origem:

```env
ALLOWED_ORIGIN=https://SEU_SITE.web.app
FIREBASE_PROJECT_ID=vendas-211b4
```

## Instalar localmente

```cmd
npm --prefix apps\robot install
npx --prefix apps\robot playwright install chromium
```

Crie `apps\robot\.env` e execute:

```cmd
npm --prefix apps\robot run login:auto
npm --prefix apps\robot run dev
```

O backend ficará em:

`http://localhost:8081`

No `apps/web/.env`:

```env
VITE_ROBOT_URL=http://localhost:8081
```

## Fluxo implementado

1. abre a Plataforma Click;
2. autentica com as credenciais do backend;
3. pesquisa o código;
4. abre o produto;
5. clica em Comprar;
6. escolhe voltagem somente quando a tela pedir;
7. escolhe garantia ou sem garantia;
8. informa CPF;
9. avança até a forma de pagamento;
10. escolhe Crediário;
11. seleciona 48 / CT1 / CT2;
12. informa parcelas;
13. em CT2 usa entrada variável;
14. captura o resultado da simulação.

### Proteção de compra

O robô **não clica** em botões identificados como confirmação final da compra, como `Confirmar compra`, `Concluir pedido`, `Efetuar compra` ou `Finalizar pedido`.

Ele para na simulação de crediário.

## CAPTCHA / MFA

Se o site exigir CAPTCHA, código de verificação, 2FA ou MFA, o robô retorna:

`CLICK_INTERACTIVE_CHALLENGE_REQUIRED`

Ele não tenta contornar esse mecanismo.

## Hospedagem

Há um `Dockerfile` em `apps/robot`. O backend pode ser executado em um serviço externo que suporte Docker + Playwright. As credenciais devem ser cadastradas no painel de variáveis secretas desse serviço, nunca no código.

O Firebase continua no plano Spark para Hosting, Auth e Firestore.
