"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.generateTraceCode = generateTraceCode;
exports.generateBatchCode = generateBatchCode;
const node_crypto_1 = __importDefault(require("node:crypto"));
function hashPassword(password) {
    const salt = node_crypto_1.default.randomBytes(16).toString('hex');
    const hash = node_crypto_1.default.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
}
function verifyPassword(password, stored) {
    if (!stored)
        return false;
    const [salt, hash] = stored.split(':');
    if (!salt || !hash)
        return false;
    const expected = Buffer.from(hash, 'hex');
    const actual = node_crypto_1.default.scryptSync(password, salt, 64);
    if (expected.length !== actual.length)
        return false;
    return node_crypto_1.default.timingSafeEqual(expected, actual);
}
/** Código curto e legível para o QR Code de rastreabilidade (8 caracteres). */
function generateTraceCode() {
    return node_crypto_1.default.randomBytes(4).toString('hex').toUpperCase();
}
/** Código de lote legível no formato LOTE-YYMMDD-XXXX. */
function generateBatchCode() {
    const now = new Date();
    const stamp = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const suffix = node_crypto_1.default.randomBytes(2).toString('hex').toUpperCase();
    return `LOTE-${stamp}-${suffix}`;
}
//# sourceMappingURL=crypto.js.map