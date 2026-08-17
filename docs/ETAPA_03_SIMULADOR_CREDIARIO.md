# Etapa 03 — Simulador de Crediário

Interface implementada:
- cliente novo → regra 48;
- tradicional sem entrada → CT1;
- tradicional com entrada → CT2;
- quantidade de parcelas;
- entrada variável no CT2;
- código herdado da Pesquisa Rápida de Produto.

## Segurança
O sistema não possui código que confirme/finalize a venda.

## Calibração necessária
Ainda precisamos mapear os elementos reais da tela de pagamento da Plataforma Click. Depois do login:

```powershell
cd apps\robot
npm run inspect:credit
```

Na janela aberta, navegue manualmente até a tela onde aparecem Crediário / 48 / CT1 / CT2. Aguarde o diagnóstico aparecer no PowerShell e envie o resultado.

Com isso a próxima revisão poderá ligar o simulador à tela real sem adivinhar seletores.
