"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const env_1 = require("./config/env");
const auth_routes_1 = require("./routes/auth.routes");
const routes_1 = require("./routes");
const error_1 = require("./middleware/error");
exports.app = (0, express_1.default)();
exports.app.disable('x-powered-by');
exports.app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
exports.app.use((0, cors_1.default)({
    origin: env_1.env.corsOrigins.includes('*') ? true : env_1.env.corsOrigins,
}));
exports.app.use(express_1.default.json({ limit: '1mb' }));
exports.app.use(express_1.default.urlencoded({ extended: true }));
if (env_1.env.nodeEnv !== 'test') {
    exports.app.use((0, morgan_1.default)(env_1.isDemo ? 'dev' : 'combined'));
}
exports.app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        app: 'Plastikkimik Pytangy API',
        version: '1.0.0',
        demoMode: env_1.isDemo,
        timestamp: new Date().toISOString(),
    });
});
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    limit: 120,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
        error: {
            code: 'RATE_LIMITED',
            message: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
        },
    },
});
exports.app.use('/api/auth', authLimiter, auth_routes_1.authRoutes);
exports.app.use('/api', routes_1.apiRoutes);
exports.app.use(error_1.notFoundHandler);
exports.app.use(error_1.errorHandler);
//# sourceMappingURL=app.js.map