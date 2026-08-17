# Checklist E2E — XVendas

Preencha após publicar em homologação.

## 1. Autenticação
- [ ] usuário autorizado entra no XVendas;
- [ ] logout encerra a sessão;
- [ ] outro usuário não lê os dados privados do primeiro.

## 2. Pesquisa de produto
- [ ] pesquisar por código retorna o produto correto;
- [ ] nome/preço exibidos correspondem à fonte autorizada;
- [ ] produto sem voltagem não exige seleção;
- [ ] produto com voltagem exige a opção correta;
- [ ] erro de pesquisa aparece de forma compreensível.

## 3. Crediário
- [ ] Cliente Novo / 48;
- [ ] CT1 sem entrada;
- [ ] CT2 com entrada;
- [ ] quantidade de parcelas é respeitada;
- [ ] entrada variável é aplicada quando solicitada;
- [ ] resultado apresentado corresponde ao resultado real da plataforma autorizada;
- [ ] nenhuma senha é gravada no Firestore ou frontend.

## 4. Atendimento e copiloto
- [ ] Modo Atendimento avança pelas etapas;
- [ ] Próxima Melhor Ação responde ao contexto;
- [ ] perguntas sugeridas aparecem;
- [ ] detector de fechamento reage a sinais de compra;
- [ ] alerta de falar demais funciona;
- [ ] perfil e necessidades escondidas são coerentes com as anotações.

## 5. Fechamento
- [ ] venda fechada é registrada;
- [ ] venda perdida é registrada;
- [ ] produtos, valor, adicionais, abordagem e objeção ficam associados;
- [ ] desempenho é atualizado;
- [ ] banco de objeções é atualizado;
- [ ] aprendizado de combos recebe o resultado.

## 6. Firestore
- [ ] performanceSales grava;
- [ ] objectionBank grava;
- [ ] lostSaleLearning grava;
- [ ] attendances grava;
- [ ] gamification grava;
- [ ] usuário A não acessa documentos do usuário B.

## 7. Comparação e QR
- [ ] selecionar 2 produtos;
- [ ] selecionar 3 produtos;
- [ ] QR é escaneado por um celular real;
- [ ] página pública abre;
- [ ] CPF/login/crediário não aparecem no link;
- [ ] aviso de preço/estoque aparece;
- [ ] comparação expirada mostra aviso.

## 8. Responsividade
- [ ] desktop;
- [ ] celular Android;
- [ ] iPhone, se disponível;
- [ ] botões não ficam cortados;
- [ ] campos podem ser preenchidos com teclado móvel.

## 9. Critério de aprovação
Homologação só é aprovada quando os fluxos críticos acima funcionarem e nenhum erro de permissão, autenticação ou cálculo permanecer aberto.
