"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.notFoundHandler = void 0;
const multer_1 = __importDefault(require("multer"));
const zod_1 = require("zod");
const errors_1 = require("../errors");
const notFoundHandler = (req, res) => {
    res.status(404).json({
        error: {
            code: 'ENDPOINT_NOT_FOUND',
            message: `Endpoint não encontrado: ${req.method} ${req.originalUrl}`,
        },
    });
};
exports.notFoundHandler = notFoundHandler;
const errorHandler = (error, _req, res, _next) => {
    if (res.headersSent)
        return;
    if (error instanceof errors_1.ApiError) {
        res.status(error.statusCode).json({
            error: {
                code: error.code,
                message: error.message,
                details: error.details ?? null,
            },
        });
        return;
    }
    if (error instanceof zod_1.ZodError) {
        res.status(422).json({
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Revise os campos informados.',
                details: error.flatten(),
            },
        });
        return;
    }
    if (error instanceof multer_1.default.MulterError) {
        const message = error.code === 'LIMIT_FILE_SIZE'
            ? 'O arquivo excede o limite de tamanho permitido.'
            : 'Não foi possível processar o upload.';
        res.status(400).json({ error: { code: 'UPLOAD_ERROR', message } });
        return;
    }
    if (error instanceof SyntaxError && 'body' in error) {
        res.status(400).json({ error: { code: 'BAD_JSON', message: 'JSON inválido na requisição.' } });
        return;
    }
    console.error('[api] erro não tratado:', error);
    res.status(500).json({
        error: {
            code: 'INTERNAL_ERROR',
            message: 'Ocorreu um erro interno. Tente novamente em instantes.',
        },
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=error.js.map