"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLICK_PASSWORD = exports.CLICK_USERNAME = exports.CLICK_BASE_URL = void 0;
exports.getClickConfig = getClickConfig;
const params_1 = require("firebase-functions/params");
exports.CLICK_BASE_URL = (0, params_1.defineString)("CLICK_BASE_URL", { default: "" });
exports.CLICK_USERNAME = (0, params_1.defineSecret)("CLICK_USERNAME");
exports.CLICK_PASSWORD = (0, params_1.defineSecret)("CLICK_PASSWORD");
function getClickConfig() {
    const baseUrl = exports.CLICK_BASE_URL.value().trim();
    if (!baseUrl)
        throw new Error("CLICK_BASE_URL_NOT_CONFIGURED");
    return { baseUrl, username: exports.CLICK_USERNAME.value(), password: exports.CLICK_PASSWORD.value() };
}
