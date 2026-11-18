"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = asyncHandler;
exports.validateBody = validateBody;
const errors_1 = require("../errors");
/** Encaminha rejeições de handlers assíncronos para o error handler do Express. */
function asyncHandler(handler) {
    return (req, res, next) => {
        Promise.resolve(handler(req, res, next)).catch(next);
    };
}
function validateBody(schema) {
    return (req, _res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            next(new errors_1.ApiError(422, 'VALIDATION_ERROR', 'Revise os campos informados.', result.error.flatten()));
            return;
        }
        req.body = result.data;
        next();
    };
}
//# sourceMappingURL=validate.js.map