"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClickAdapter = createClickAdapter;
const clickConfig_js_1 = require("./clickConfig.js");
/**
 * This transport must be implemented from official/authorized Plataforma Click
 * API documentation or another method explicitly permitted by the service.
 * It must not bypass CAPTCHA, MFA, rate limits, or anti-bot controls.
 */
const transport = {
    async lookupProduct() {
        throw new Error("CLICK_AUTHORIZED_PROTOCOL_NOT_CONFIGURED");
    },
    async simulateCredit() {
        throw new Error("CLICK_AUTHORIZED_PROTOCOL_NOT_CONFIGURED");
    }
};
function createClickAdapter() {
    return {
        async lookupProduct(input) {
            const config = (0, clickConfig_js_1.getClickConfig)();
            return transport.lookupProduct(config, input);
        },
        async simulateCredit(input) {
            const config = (0, clickConfig_js_1.getClickConfig)();
            return transport.simulateCredit(config, input);
        }
    };
}
