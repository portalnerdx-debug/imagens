# Etapa 41 — Correção do Crediário

O módulo ausente detectado na Etapa 40 foi implementado.

Incluído:
- Cliente Novo — plano 48;
- CT1 sem entrada;
- CT2 com entrada variável;
- quantidade de parcelas;
- voltagem opcional, porque nem todo produto exige;
- garantia opcional;
- CPF digitado somente no momento da consulta;
- CPF excluído do objeto destinado a histórico/persistência;
- regra explícita: o XVendas não calcula/inventa a condição final; ela deve vir da Plataforma Click autorizada.

A próxima integração deve conectar o botão de simulação ao adaptador seguro da Plataforma Click, mantendo login e credenciais fora do frontend.
