"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.simulateClickCredit = exports.lookupClickProduct = void 0;
const app_1 = require("firebase-admin/app");
const https_1 = require("firebase-functions/v2/https");
const clickAdapter_js_1 = require("./clickAdapter.js");
const clickTypes_js_1 = require("./clickTypes.js");
const clickConfig_js_1 = require("./clickConfig.js");
(0, app_1.initializeApp)();
const click = (0, clickAdapter_js_1.createClickAdapter)();
function requireAuth(auth) {
    if (!auth)
        throw new https_1.HttpsError("unauthenticated", "Faça login no XVendas.");
}
exports.lookupClickProduct = (0, https_1.onCall)({ region: "southamerica-east1", secrets: [clickConfig_js_1.CLICK_USERNAME, clickConfig_js_1.CLICK_PASSWORD] }, async (req) => {
    requireAuth(req.auth);
    const code = String(req.data?.code || "").trim();
    if (!/^[A-Za-z0-9._-]{1,40}$/.test(code))
        throw new https_1.HttpsError("invalid-argument", "Código de produto inválido.");
    try {
        return (0, clickTypes_js_1.normalizeProduct)(await click.lookupProduct({ code }), code);
    }
    catch (e) {
        if (["CLICK_INTEGRATION_NOT_CONFIGURED", "CLICK_BASE_URL_NOT_CONFIGURED", "CLICK_AUTHORIZED_PROTOCOL_NOT_CONFIGURED"].includes(e?.message))
            throw new https_1.HttpsError("failed-precondition", "Integração autorizada com a Plataforma Click ainda não configurada.");
        throw new https_1.HttpsError("internal", "Falha ao consultar o produto.");
    }
});
exports.simulateClickCredit = (0, https_1.onCall)({ region: "southamerica-east1", secrets: [clickConfig_js_1.CLICK_USERNAME, clickConfig_js_1.CLICK_PASSWORD] }, async (req) => {
    requireAuth(req.auth);
    const d = req.data || {}, plan = String(d.plan || "");
    const installments = Number(d.installments);
    const cpf = String(d.cpf || "").replace(/\D/g, "");
    if (!["48", "CT1", "CT2"].includes(plan))
        throw new https_1.HttpsError("invalid-argument", "Plano inválido.");
    if (!Number.isInteger(installments) || installments < 1 || installments > 48)
        throw new https_1.HttpsError("invalid-argument", "Parcelas inválidas.");
    if (cpf.length !== 11)
        throw new https_1.HttpsError("invalid-argument", "CPF inválido.");
    if (plan === "CT2" && !(Number(d.entry) > 0))
        throw new https_1.HttpsError("invalid-argument", "CT2 exige entrada.");
    try {
        const input = {
            productCode: String(d.productCode || ""), plan: plan,
            installments, entry: plan === "CT2" ? Number(d.entry) : undefined,
            voltage: d.voltage ? String(d.voltage) : undefined, warranty: Boolean(d.warranty), cpf
        };
        return (0, clickTypes_js_1.normalizeCredit)(await click.simulateCredit(input), input);
    }
    catch (e) {
        if (["CLICK_INTEGRATION_NOT_CONFIGURED", "CLICK_BASE_URL_NOT_CONFIGURED", "CLICK_AUTHORIZED_PROTOCOL_NOT_CONFIGURED"].includes(e?.message))
            throw new https_1.HttpsError("failed-precondition", "Integração autorizada com a Plataforma Click ainda não configurada.");
        throw new https_1.HttpsError("internal", "Falha ao simular o crediário.");
    }
});
