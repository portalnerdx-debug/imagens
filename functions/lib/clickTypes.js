"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeProduct = normalizeProduct;
exports.normalizeCredit = normalizeCredit;
function normalizeProduct(raw, requestedCode) {
    return {
        code: String(raw?.code ?? raw?.codigo ?? requestedCode),
        name: String(raw?.name ?? raw?.nome ?? raw?.description ?? raw?.descricao ?? "Produto"),
        price: num(raw?.price ?? raw?.preco),
        stock: num(raw?.stock ?? raw?.estoque),
        voltageOptions: Array.isArray(raw?.voltageOptions) ? raw.voltageOptions.map(String) : undefined,
        brand: raw?.brand ?? raw?.marca ? String(raw?.brand ?? raw?.marca) : undefined
    };
}
function normalizeCredit(raw, input) {
    const entry = num(raw?.entry ?? raw?.entrada) ?? input.entry ?? 0;
    const installmentValue = num(raw?.installmentValue ?? raw?.valorParcela ?? raw?.parcela);
    const total = num(raw?.total ?? raw?.valorTotal);
    if (installmentValue === undefined || total === undefined)
        throw new Error("CLICK_INVALID_CREDIT_RESPONSE");
    return { productCode: input.productCode, plan: input.plan, installments: input.installments, entry, installmentValue, total, message: raw?.message ?? raw?.mensagem };
}
function num(v) { if (v === undefined || v === null || v === "")
    return undefined; const n = Number(String(v).replace(",", ".")); return Number.isFinite(n) ? n : undefined; }
