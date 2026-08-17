"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateProductCode = validateProductCode;
exports.validateCpf = validateCpf;
exports.validateCredit = validateCredit;
exports.mapClickError = mapClickError;
function validateProductCode(code) {
    return /^[A-Za-z0-9._-]{1,40}$/.test(code);
}
function validateCpf(cpf) {
    return /^\d{11}$/.test(cpf);
}
function validateCredit(plan, installments, entry) {
    if (!["48", "CT1", "CT2"].includes(plan))
        return "INVALID_PLAN";
    if (!Number.isInteger(installments) || installments < 1 || installments > 48)
        return "INVALID_INSTALLMENTS";
    if (plan === "CT2" && !(Number(entry) > 0))
        return "ENTRY_REQUIRED";
    return null;
}
function mapClickError(message) {
    if (message === "CLICK_INTEGRATION_NOT_CONFIGURED")
        return "failed-precondition";
    if (message === "CLICK_AUTH_FAILED")
        return "permission-denied";
    if (message === "CLICK_RATE_LIMITED")
        return "resource-exhausted";
    if (message === "CLICK_TIMEOUT")
        return "deadline-exceeded";
    return "internal";
}
