# Etapa 25 — Banco de Objeções + Analisador de Venda Perdida

Implementado:
- classificação automática de objeções;
- resposta sugerida por categoria;
- registro do resultado: pendente, recuperada ou perdida;
- banco de objeções no Firestore;
- registro estruturado de vendas perdidas;
- ranking dos principais motivos;
- taxa de recuperação por tipo de objeção;
- identificação do principal ponto para treinamento.

Estruturas:
- `/users/{uid}/objectionBank`
- `/users/{uid}/lostSaleLearning`

Próxima etapa:
**Treinador Pessoal + Avaliação do Atendimento**, usando fechamento, descoberta, objeções e perdas para indicar os pontos que o vendedor precisa melhorar.
