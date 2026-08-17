# Organização Etapa 07 — Integração Plataforma Click

## Objetivo
Transformar a consulta de produto do XVendas em um conector autenticado com a Plataforma Click, usando o fluxo real observado no HAR fornecido pelo usuário.

## Fluxo confirmado no HAR
- `POST /busca` com formulário `termo=<codigo>` para pesquisar produto.
- URLs de detalhe iniciadas pelo código do produto, por exemplo `/<codigo>/<slug>/...`.
- Imagens sob `/sistema/imgp/produto/<codigo>_...`.
- A filial aparece na sessão/logado (ex.: `LG53`).
- O checkout possui endpoints AJAX próprios para pagamento, parcelas, entrada, montagem e entrega; estes ficam para a próxima subetapa porque alteram estado de carrinho/pagamento.

## Implementado
1. O backend Playwright tenta primeiro `POST /busca` usando `page.request`, que compartilha os cookies da sessão autenticada do BrowserContext.
2. O HTML de busca é usado para localizar a URL do produto pelo código.
3. O produto é aberto e o backend extrai nome, preço exposto, filial, voltagens, imagem e possível estoque.
4. Se a busca direta não retornar uma URL reconhecível, o sistema usa a automação visual anterior como contingência.
5. O front-end agora usa o `ClickGateway`, enviando token Firebase ao backend. Isso corrige a consulta que antes chamava `/api/products/:code` sem autenticação.
6. Nenhuma credencial da Plataforma Click é enviada ao navegador do XVendas.

## Limites desta etapa
- A consulta é somente leitura na área de busca/detalhe.
- Não adiciona produto ao carrinho para descobrir preço.
- Não automatiza parcelas/pagamento ainda, pois esses endpoints modificam o estado do checkout.
- Estoque só é mostrado se a página de produto expuser um valor reconhecível.

## Variáveis do robô
Veja `apps/robot/.env.example`. O backend precisa de `CLICK_BASE_URL`, credenciais autorizadas da sessão Click, Firebase Project ID e `ALLOWED_ORIGIN`.
