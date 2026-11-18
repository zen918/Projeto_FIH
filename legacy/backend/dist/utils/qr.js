"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateQrCodePng = generateQrCodePng;
exports.buildTraceUrl = buildTraceUrl;
const qrcode_1 = __importDefault(require("qrcode"));
async function generateQrCodePng(content) {
    return qrcode_1.default.toBuffer(content, {
        type: 'png',
        width: 640,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: {
            dark: '#1c1917',
            light: '#ffffff',
        },
    });
}
function buildTraceUrl(traceCode, publicAppUrl) {
    return `${publicAppUrl}/r/${traceCode}`;
}
//# sourceMappingURL=qr.js.map