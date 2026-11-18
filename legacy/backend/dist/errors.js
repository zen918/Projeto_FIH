"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.conflict = exports.notFound = exports.forbidden = exports.unauthorized = exports.badRequest = exports.ApiError = void 0;
class ApiError extends Error {
    statusCode;
    code;
    details;
    constructor(statusCode, code, message, details) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
    }
}
exports.ApiError = ApiError;
const badRequest = (message, details) => new ApiError(400, 'BAD_REQUEST', message, details);
exports.badRequest = badRequest;
const unauthorized = (message = 'Autenticação necessária.') => new ApiError(401, 'UNAUTHORIZED', message);
exports.unauthorized = unauthorized;
const forbidden = (message = 'Você não tem permissão para esta ação.', code = 'FORBIDDEN') => new ApiError(403, code, message);
exports.forbidden = forbidden;
const notFound = (message = 'Registro não encontrado.') => new ApiError(404, 'NOT_FOUND', message);
exports.notFound = notFound;
const conflict = (message, code = 'CONFLICT') => new ApiError(409, code, message);
exports.conflict = conflict;
//# sourceMappingURL=errors.js.map