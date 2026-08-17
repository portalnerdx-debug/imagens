# Etapa 31 — QR Code real + comparação pública

Implementado:
- QR Code escaneável com a biblioteca `qrcode`;
- rota pública `#/comparar/{token}`;
- página mobile para o cliente;
- comparação de 2 ou 3 produtos;
- expiração lógica em 24 horas;
- botão copiar e Web Share API;
- payload limitado a código, nome, preço e estoque;
- CPF, login e dados de crediário não são incluídos.

## Instalação
Como foi adicionada uma dependência, execute `npm install` antes do próximo build/deploy.

## Segurança
O token é transportável e não deve carregar dados sensíveis. Nesta versão os dados ficam codificados no próprio link. Para revogação antecipada e atualização centralizada, a próxima evolução pode usar documentos públicos temporários no Firestore/Functions.

## Próxima etapa
Integração de inteligência baseada nas próprias vendas: combinações, abordagens e padrões que mais convertem.
