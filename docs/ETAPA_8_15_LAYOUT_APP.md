# Etapa 8.15 — layout em formato de aplicativo

## Melhorias realizadas

- menu lateral no computador e navegação inferior no celular;
- cada atalho principal abre em uma página própria;
- rotas internas para início, atendimento, produtos, crédito, treinamento,
  metas e histórico;
- suporte ao botão Voltar do navegador;
- nova tela inicial com hierarquia visual, atalhos e fluxo recomendado;
- formulário de novo atendimento reorganizado;
- componentes visuais responsivos e acessíveis;
- conexão padrão preservada com `https://xvendas-robot.onrender.com`.

## Publicação no Firebase

Na pasta do projeto, execute:

```bat
npm install
npm run build
firebase deploy --only hosting --project vendas-211b4
```

Depois da publicação, abra o site e pressione `Ctrl + Shift + R` uma vez para
descartar os arquivos visuais antigos guardados pelo navegador.
