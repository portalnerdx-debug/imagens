# Etapa 01 — Modo Atendimento

Implementado nesta etapa:

- tela de início do atendimento;
- nome opcional do cliente;
- objetivo da compra;
- orçamento aproximado;
- seis etapas do atendimento;
- progresso visual;
- orientação por etapa;
- primeira versão de “O que pergunto agora?”;
- primeira versão de “Próxima Melhor Ação”;
- anotações do que o cliente disse;
- resumo e mapa da conversa;
- endpoints básicos da API para criar sessão, avançar etapa, registrar nota e finalizar.

## Persistência

A API desta etapa usa memória apenas para validar o fluxo. Na próxima fase de infraestrutura, as sessões serão persistidas no Firestore.

## Segurança

O robô da Plataforma Click continua isolado e nenhuma ação de compra é executada nesta etapa.
