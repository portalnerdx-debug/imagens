# Etapa 45 — Adapter real: camada de credenciais e contrato autorizado

Implementado nesta etapa:
- `CLICK_USERNAME` em Firebase Secret Manager;
- `CLICK_PASSWORD` em Firebase Secret Manager;
- `CLICK_BASE_URL` como parâmetro de servidor;
- secrets vinculados somente às duas Cloud Functions que precisam deles;
- adapter separado do frontend;
- validação automática para impedir endpoint da Plataforma Click codificado sem um protocolo autorizado.

## Configuração no Firebase

Depois de confirmar que sua conta/empresa está autorizada a usar essa integração:

```powershell
firebase functions:secrets:set CLICK_USERNAME
firebase functions:secrets:set CLICK_PASSWORD
```

Configure `CLICK_BASE_URL` no ambiente das Functions conforme o endpoint oficial fornecido pelo serviço.

## O que falta para o adapter consultar de verdade

Precisamos do protocolo autorizado: documentação de API, endpoint oficial, especificação fornecida pela empresa ou outro método de automação expressamente permitido. Não é seguro inferir endpoints internos do site nem implementar contorno de CAPTCHA/MFA/anti-bot.

Assim que esse protocolo estiver disponível, somente `functions/src/clickAdapter.ts` precisa ser preenchido; o restante do XVendas já conversa com ele.

## Restam
46 — testes automatizados e resiliência;
47 — homologação real;
48 — deploy final / versão 1.0.
