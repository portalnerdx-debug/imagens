# Etapa 16 — Preços, Estoque e Pesquisa Real

## Implementado
- serviço `ProductDataService`;
- endpoint `GET /api/products/:code`;
- pesquisa real pela Plataforma Click usando a sessão Playwright;
- tentativa de capturar nome, preço e estoque;
- painel de preço/estoque dentro do atendimento;
- origem e horário da captura;
- comportamento seguro quando um dado não puder ser identificado.

## Importante
A automação ainda depende do HTML real da Plataforma Click. Como os seletores exatos do preço/estoque podem variar, esta versão tenta extrair os dados do bloco do produto e **não inventa valores**.

Se preço ou estoque aparecer como `Não capturado`, rode:

```powershell
cd apps\robot
npm run inspect
```

e envie a saída dos elementos relevantes para refinarmos os seletores.

## Executar
Primeiro login:
```powershell
cd apps\robot
npm run login
```

Depois:
```powershell
npm run dev
```

Na raiz, em outro terminal:
```powershell
npm run dev:web
```

## Próxima etapa
Conectar os dados reais de preço/estoque automaticamente à:
- Ficha Inteligente;
- Venda Combinada;
- Batalha de Produtos;
- Montador de Casa Completa;
- Calculadora de Orçamento.
