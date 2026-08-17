# Etapa 8.14 — frontend conectado ao robô no Render

O frontend agora usa `https://xvendas-robot.onrender.com` como endereço padrão
do backend de automação. A variável `VITE_ROBOT_URL` continua podendo substituir
esse endereço quando for necessário usar outro servidor.

Arquivos corrigidos:

- `apps/web/src/main.tsx`
- `apps/web/src/ClickGateway.ts`
- `apps/web/src/CreditSimulator.tsx`

Para publicar o frontend atualizado no Firebase:

```bat
npm install
npm run build
firebase deploy --only hosting
```

Depois da publicação, recarregue o site com `Ctrl + F5` e confirme na aba
Network que as requisições começam com `https://xvendas-robot.onrender.com`.
