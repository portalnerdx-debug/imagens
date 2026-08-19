# Changelog

## Etapa 8.27 — AJAX de pagamento dentro do navegador
- As chamadas de pagamento CT1, CT2 e 48 agora são executadas por `fetch` dentro da página autenticada.
- Cookies, origem, referenciador e cabeçalhos passam a ser os mesmos usados pelo JavaScript da Plataforma Click.
- Se a primeira inclusão CT2/48 vier vazia, a condição é recriada uma vez e a Entrada Variável é reativada.
- O diagnóstico informa também se a reconstrução devolveu formulário ou identificador.

## Etapa 8.26 — id da entrada por múltiplas fontes
- CT2 e Cliente Novo 48 guardam o id na resposta do plano antes de ativar Entrada Variável.
- O id também é procurado na primeira página recarregada e na resposta da ativação.
- A leitura final do formulário continua como último fallback.
- Respostas JSON com HTML aninhado em chaves diferentes também são reconhecidas.

## Etapa 8.25 — id da entrada Cliente Novo 48 pelo HAR 9
- O identificador dinâmico da entrada é capturado diretamente do JSON retornado ao criar a condição 48.
- O campo `html` da resposta é analisado dentro de `pagamentos_ent`, sem confundir a entrada com a parcela financiada.
- O recarregamento da página permanece como alternativa para outras versões da Plataforma Click.
- O valor continua sendo enviado ao `processa_inclui_pagamento_variavel_ajax.php` com o id real da consulta atual.

## Etapa 8.24 — novo login em cada consulta de crediário
- Cada simulação de crediário cria uma sessão Click nova antes de começar.
- A tentativa de zerar o carrinho anterior foi removida do fluxo de simulação.
- Pesquisa de produtos continua usando a sessão reaproveitável existente.
- Se a sessão nova expirar durante a consulta, ocorre somente uma repetição.
- Cookies e arquivos de autenticação não fazem parte do pacote de entrega.

## Etapa 8.23 — login automático compatível com a Click
- O renovador envia o login ao endpoint AJAX real da Plataforma Click.
- A resposta do servidor é aguardada e validada antes de salvar a sessão.
- Códigos de sucesso `0` e `101` são aceitos; troca obrigatória de senha é identificada separadamente.
- O retry único e a ordem de limpeza do carrinho da etapa 8.22 foram preservados.

## Etapa 8.22 — pagamento resetado antes do carrinho
- A condição de pagamento e a entrada da consulta anterior são resetadas antes de qualquer exclusão de produto.
- Depois do reset, os produtos antigos são removidos pela rota AJAX real e o contador precisa chegar a zero.
- Somente após essa confirmação o produto atual e os auxiliares da nova simulação são adicionados.
- Se a Plataforma Click ainda mantiver itens, continua valendo a recuperação por sessão nova da etapa 8.21.

## Etapa 8.21 — sessão nova quando o carrinho fica preso
- A limpeza AJAX continua sendo a primeira tentativa, por ser mais rápida.
- Se o carrinho não confirmar zero itens, o robô descarta a tentativa e cria uma sessão autenticada nova.
- A simulação completa é repetida somente uma vez na sessão nova.
- O Render registra a quantidade e os códigos restantes para facilitar o diagnóstico sem expor credenciais.

## Etapa 8.20 — exclusão AJAX real do carrinho
- A limpeza reconhece o código em `data-item` nos botões `.link-excluir` usados atualmente pela Plataforma Click.
- Cada produto é removido por `carrinho_excluir_ajax.php`, reproduzindo o clique no X da linha.
- O carrinho é recarregado e precisa confirmar zero itens antes de a nova simulação continuar.
- O reset da condição de pagamento recebe parâmetros anticache para não reaproveitar o estado anterior.

## Etapa 8.19 — renovação automática da sessão Click
- Ao receber `CLICK_SESSION_EXPIRED`, o Render refaz o login automaticamente e repete a operação uma vez.
- Consultas simultâneas compartilham a mesma renovação para não realizar vários logins ao mesmo tempo.
- O novo arquivo de cookies substitui o antigo somente depois de estar completamente salvo.
- Credenciais ausentes, login recusado e desafio interativo agora possuem mensagens específicas no site.

## Etapa 8.18 — captura resiliente da entrada variável
- Removida a espera de 30 segundos em um `data-cdpagamento` inexistente.
- O robô tenta `data-cdpagamento` e os formatos alternativos de `data-item` dentro de `pagamentos_ent`.
- Valores curtos da condição, como `data-item="1"`, não são confundidos com o id dinâmico do pagamento.
- Se a entrada ainda não estiver disponível, a página é recarregada uma vez antes do erro específico do plano.
- O diagnóstico do Render agora informa se havia formulário, entrada variável ou aviso de faixa prestamista.

## Etapa 8.17 — produto prestamista por faixa do total
- A regra vale igualmente para CT1, CT2 e Cliente Novo 48.
- O total é lido depois dos produtos base e da garantia, antes de qualquer código `849xxx`.
- Até R$ 1.000,00 usa `849043`; de R$ 1.000,01 a R$ 1.500,00 usa `849050`.
- De R$ 1.500,01 a R$ 2.000,00 usa `849067`; de R$ 2.000,01 a R$ 2.500,00 usa `849074`.
- Acima de R$ 2.500,00 usa `849081`.
- Todos os códigos da família são removidos antes da inclusão, garantindo exatamente uma faixa no carrinho.

## Etapa 8.16 — carrinho zerado em toda simulação
- Todos os itens e a condição de pagamento anterior são removidos antes de CT1, CT2 ou Cliente Novo 48.
- A consulta só continua depois que o carrinho confirma zero itens.

## Etapa 8.13 — publicação gratuita no Render
- Adicionado `render.yaml` para criar automaticamente o serviço Docker gratuito.
- Credenciais da Plataforma Click são solicitadas como segredos e não ficam no repositório.
- Configurados CORS do Firebase, health check `/health` e implantação automática por commit.
- O contêiner usa instalação reproduzível e Chromium ajustado para o `/dev/shm` limitado.
- Incluído guia completo para conectar a URL HTTPS do Render ao frontend Firebase.

## Etapa 8.12 — retirada do 447164 no Cliente Novo 48
- O robô remove explicitamente o código tradicional `447164` antes de preparar o carrinho Cliente Novo.
- O plano 48 mantém somente `447157`, `801911` (3 unidades) e o seguro condicional `849081`.
- CT1 e CT2 continuam usando `447164` normalmente.

## Etapa 8.11 — Cliente Novo 48 com entrada variável
- A condição Cliente Novo agora usa diretamente `cod_pagto=48` no fluxo confirmado pelo HAR.
- Inclui 1 unidade de `447157` no lugar de `447164`, além de 3 unidades de `801911`.
- Para produto principal acima de R$ 2.500,00, inclui também 1 unidade de `849081`.
- A entrada variável é obrigatória, atualizada após o recarregamento da tela e enviada com o identificador dinâmico do pagamento.
- O código `48` é o identificador da condição; a tela permite de 2 a 24 pagamentos totais (entrada + até 23 parcelas).

## Etapa 8.10 — CT2 com entrada variável
- O CT2 agora usa o mesmo preparo de carrinho, produtos obrigatórios, garantia e CPF do CT1.
- Seleciona `CT2`, ativa Entrada Variável e envia o valor pelo evento real de atualização observado no HAR.
- O identificador da linha de entrada é capturado dinamicamente a cada simulação.
- A entrada mínima da Plataforma Click é validada.
- O resultado separa entrada, parcelas financiadas, total parcelado e total geral.

## Etapa 8.9 — garantia confirmada no carrinho CT1
- Depois de preparar o carrinho, o robô chama o serviço real de garantia da Plataforma Click.
- "Com garantia" aplica `cd_servico=831055`; "sem garantia" aplica `cd_servico=0`.
- A garantia é vinculada ao código do produto principal e o novo total retornado é validado.
- O resultado do XVendas informa se a garantia foi aplicada e o total do carrinho naquele momento.

## Etapa 8.8 — avanço do CPF no CT1
- O CT1 envia o CPF pelo fluxo real `processa_loginc.php` com pessoa física.
- Depois do envio, abre diretamente `carrinho-entrega.php?reload=sim`.
- Removida a dependência de botões genéricos como "Finalizar", "Continuar" ou "Prosseguir" no CT1.

## Etapa 8.7 — seleção real de garantia
- A presença da palavra "garantia" na descrição do produto não é mais confundida com a tela de escolha.
- O robô reconhece `garantiaNovo.php` e seleciona os links reais com `op_garantia`.
- "Com garantia" escolhe uma opção adicional diferente de zero; "sem garantia" escolhe explicitamente `op_garantia=0`.

## Etapa 8.6 — produtos auxiliares obrigatórios do CT1
- O carrinho CT1 agora inclui 1 unidade de `447164` e 3 unidades de `801911`.
- Para produto principal acima de R$ 2.500,00, inclui também 1 unidade de `849081`.
- O robô verifica o carrinho antes de adicionar e fixa as quantidades pelo fluxo real da Plataforma Click.
- A consulta é interrompida se o preço principal não estiver confirmado, evitando aplicar incorretamente a regra do seguro prestamista.

## Etapa 8.5 — crediário tradicional sem entrada (CT1)
- O fluxo CT1 agora reproduz a chamada real observada na Plataforma Click, usando a condição `CT1` e a quantidade de parcelas selecionada.
- Depois da simulação, o robô recarrega a tela de entrega/pagamento e extrai o valor da parcela e o total exibidos.
- CT1 foi limitado a 1–24 parcelas, conforme a condição disponibilizada pela Plataforma Click.
- A automação continua interrompendo o fluxo antes de qualquer confirmação de compra ou pedido.

## Etapa 8.4 — preço, estoque da filial e nome do produto
- O preço atual da Plataforma Click agora prioriza explicitamente o valor exibido depois de `Por R$`, sem confundir preço anterior ou valores ocultos.
- O estoque agora é associado à filial da sessão (por exemplo, `LG53: 5`), evitando interpretar `53` como quantidade.
- O nome do produto é extraído da linha vinculada ao código (`COD.: ...`) em vez do título genérico da aba.
- Capturas sem preço ou estoque removem o valor antigo do cache para não apresentar informação desatualizada como atual.

## 1.0.0

Primeiro pacote completo do XVendas Modular.

Principais áreas:
- Modo Atendimento e Mapa da Conversa;
- Copiloto de Vendas e Próxima Melhor Ação;
- objeções, recuperação e momento de fechamento;
- perfil do cliente e necessidades escondidas;
- venda combinada, cadeia de produtos e combos aprendidos;
- orçamento, crediário 48/CT1/CT2 e entrada;
- comparação, ficha, benefícios e demonstração;
- treinamento, cliente difícil, avaliação e quiz;
- gamificação, metas, desempenho e aprendizado;
- QR/comparação;
- estoque/preços/pesquisa;
- fechamento inteligente;
- Firebase/Firestore/Hosting/Functions;
- gateway seguro para integração autorizada;
- testes e homologação.

A integração externa da Plataforma Click permanece dependente de contrato/API oficialmente autorizado.

## Organização Etapa 06 — Modo Atendimento Rápido
- Adicionado alternador entre modo completo e modo rápido durante o atendimento.
- Criado layout focado para celular com pergunta, próxima ação, sinais e anotações essenciais.
- Ferramentas avançadas e painéis secundários ficam ocultos no modo rápido, sem perder estado.
- Navegação entre etapas e ações de avanço permanecem sempre acessíveis.

## Organização — Etapa 7: Integração Plataforma Click
- Consulta de produto passa a usar primeiro `POST /busca`, observado no HAR real da Plataforma Click.
- Navegação automática para o detalhe pelo código/SKU.
- Captura de preço exposto, filial da sessão, voltagem, imagem e estoque quando disponível.
- Fallback para a busca visual Playwright já existente.
- Corrigida a pesquisa em tempo real do front-end para enviar o token Firebase ao backend protegido.
- Nenhuma senha/cookie da Plataforma Click é exposta ao navegador.

## Organização — Etapa 8: Condições reais de pagamento
- Produto consultado na Etapa 7 ganhou simulação de crediário integrada no mesmo painel.
- Planos 48, CT1 e CT2 disponíveis com seleção de parcelas.
- Entrada variável aparece somente no CT2.
- Voltagens identificadas no produto são reaproveitadas automaticamente.
- Resultado mostra entrada, parcela e total somente quando retornados/capturados pelo backend.
- CPF permanece temporário no fluxo de consulta e não é persistido pelo componente.
- A automação mantém parada segura antes da confirmação final de compra.

## Correção CORS — Etapa 8.1

- `ALLOWED_ORIGIN` agora aceita múltiplas origens separadas por vírgula.
- O backend valida a origem da requisição e devolve somente uma origem em `Access-Control-Allow-Origin`.
- Incluídos Firebase Hosting (`web.app` e `firebaseapp.com`) e localhost no exemplo de ambiente.
- Corrige o erro do navegador: `Access-Control-Allow-Origin header contains multiple values`.

## Etapa 8.2 — Login Windows e diagnóstico do erro 500

- Corrige a detecção de execução direta de `apps/robot/src/loginAuto.ts` no Windows usando `fileURLToPath` + `path.resolve`.
- Preserva `loginAuto.ts` como módulo seguro quando importado por `browser.ts`.
- `npm run robot:login` agora executa de fato a criação da sessão e informa sucesso ou erro explícito.
- Adiciona log detalhado no servidor para falhas de `GET /api/products/:code` e `POST /api/credit/simulate`.
- Adiciona diagnóstico de inicialização com URL da Plataforma Click e origens CORS permitidas, sem registrar credenciais.

## Etapa 8.3 — preço confiável e crediário por código
- Corrigida a captura de preço da Plataforma Click para não confundir parcelas, garantia, montagem ou outros valores com o preço principal do produto.
- A captura agora prioriza elementos semânticos de preço e usa fallback conservador; quando não há confiança, retorna preço não capturado em vez de valor incorreto.
- Crediário agora aceita digitação direta do código/SKU e possui botão "Buscar código".
- A simulação valida/busca o produto automaticamente, mesmo que ele não tenha sido carregado em outro módulo.
- Removido o simulador duplicado legado da área de crédito, que ainda usava uma chamada direta antiga.
