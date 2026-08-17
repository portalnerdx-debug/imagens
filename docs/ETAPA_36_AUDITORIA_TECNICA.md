# Etapa 36 — Auditoria técnica

Auditoria iniciada sobre o pacote real da Etapa 35.

## Problema real encontrado e corrigido
`apps/web/src/SalesLearning.tsx` continha sequências literais `\n` dentro do código TypeScript/TSX. Isso quebrava o parser e gerava vários erros de sintaxe no typecheck. O arquivo foi reparado.

## Dependências
A tentativa de `npm install` no ambiente de auditoria excedeu o tempo disponível. Como as dependências não ficaram instaladas, erros posteriores de `cors`, `express`, `playwright` e tipos Node não foram classificados como defeitos do código: os pacotes já constam corretamente nos `package.json`.

## Nova proteção
Foi adicionado `npm run audit:source`, que procura:
- corrupção por newline escapado em TS/TSX;
- indícios de chaves privadas/service-account dentro do código;
- possíveis CPFs padrão que mereçam revisão.

## Validação recomendada no seu computador
```bash
npm install
npm run audit
```

Se o `npm run audit` terminar sem erro, o próximo passo é configurar o projeto Firebase real e executar o deploy de homologação.
