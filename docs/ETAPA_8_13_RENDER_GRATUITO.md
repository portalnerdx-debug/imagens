# Etapa 8.13 — Backend Playwright no Render gratuito

O Firebase Hosting continua publicando o site. O serviço `xvendas-robot` executa o backend Playwright no Render e fornece uma URL HTTPS pública para pesquisa de produto e crediário.

## 1. Publicar o projeto no GitHub

Crie um repositório privado e envie o projeto completo. Não inclua arquivos `.env` nem `apps/robot/playwright/.auth/click.json`.

O `.gitignore` e o `.dockerignore` do projeto já impedem o envio desses arquivos sensíveis.

## 2. Criar o Blueprint no Render

1. Entre em <https://dashboard.render.com>.
2. Clique em **New +** e depois em **Blueprint**.
3. Conecte o repositório privado.
4. O Render detectará `render.yaml` na raiz.
5. Quando solicitado, informe `CLICK_USERNAME` e `CLICK_PASSWORD`.
6. Confirme o plano **Free** e inicie a implantação.

Usuário e senha são definidos somente como segredos do Render. Eles não ficam no GitHub, no Firebase Hosting nem no JavaScript enviado ao navegador.

## 3. Testar o backend

Depois da implantação, abra a URL do serviço acrescentando `/health`, por exemplo:

```text
https://xvendas-robot.onrender.com/health
```

O retorno esperado é:

```json
{"ok":true,"service":"xvendas-playwright","mode":"browser-automation"}
```

## 4. Ligar o frontend ao Render

Copie `apps/web/.env.production.example` para `apps/web/.env.production` e substitua pela URL real exibida pelo Render:

```env
VITE_ROBOT_URL=https://SUA-URL-REAL.onrender.com
```

Depois execute na raiz do projeto:

```bat
npm run build
firebase deploy --only hosting
```

O endereço do backend é público, mas as rotas de produto e crediário continuam exigindo um Firebase ID Token válido. As credenciais da Plataforma Click permanecem somente no Render.

## 5. Sobre suspensão e sessão

O Render gratuito pode suspender ou reiniciar o serviço. Quando o arquivo de sessão desaparecer, o XVendas realiza um novo login automático usando os segredos do Render. Um monitor pode consultar `/health` periodicamente, porém isso não impede reinicializações determinadas pela própria plataforma.

O Chromium foi configurado com `--disable-dev-shm-usage` para funcionar melhor dentro do contêiner com recursos limitados.
