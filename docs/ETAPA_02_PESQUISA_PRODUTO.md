# Etapa 02 — Pesquisa Rápida de Produto

Adicionado:
- login manual seguro na Plataforma Click;
- armazenamento local da sessão Playwright;
- endpoint de pesquisa por código;
- pesquisa integrada ao Modo Atendimento;
- resultado exibido dentro do atendimento;
- ferramenta `npm run inspect` para mapear os seletores reais caso a detecção genérica não encontre a busca.

## Primeiro uso

Na raiz:

```powershell
npm install
```

Em `apps/robot`:

```powershell
Copy-Item .env.example .env
npm run login
```

Faça login manualmente e pressione ENTER no PowerShell depois de chegar à tela principal.

Depois, na raiz:

```powershell
npm run dev:web
```

Em outro PowerShell:

```powershell
npm run dev:robot
```

## Limite desta etapa

O robô apenas pesquisa. Não clica em Comprar, não entra no crediário e não conclui pedidos.

## Se não encontrar a busca

Dentro de `apps/robot`:

```powershell
npm run inspect
```

Envie o texto mostrado em INPUTS e BOTÕES para ajustarmos os seletores na próxima revisão.
