"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const auth_service_1 = require("../services/auth.service");
const validate_1 = require("../middleware/validate");
const auth_1 = require("../middleware/auth");
const env_1 = require("../config/env");
const authService = new auth_service_1.AuthService();
exports.authRoutes = (0, express_1.Router)();
const signupSchema = zod_1.z.object({
    fullName: zod_1.z.string().trim().min(3, 'Informe seu nome completo.').max(120),
    email: zod_1.z.string().trim().email('Informe um e-mail válido.').max(160),
    password: zod_1.z.string().min(8, 'A senha deve ter ao menos 8 caracteres.').max(72),
    role: zod_1.z.enum(['floricultura', 'comercio_cliente', 'pesquisador_lab'], {
        errorMap: () => ({ message: 'Selecione um perfil válido.' }),
    }),
    organizationName: zod_1.z.string().trim().min(2, 'Informe a organização.').max(160),
    city: zod_1.z.string().trim().min(2, 'Informe a cidade.').max(80),
    phone: zod_1.z.string().trim().min(8, 'Informe um telefone válido.').max(30),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().trim().email('Informe um e-mail válido.').max(160),
    password: zod_1.z.string().min(1, 'Informe sua senha.').max(72),
});
exports.authRoutes.post('/signup', (0, validate_1.validateBody)(signupSchema), async (req, res, next) => {
    try {
        const session = await authService.signup(req.body);
        res.status(201).json(session);
    }
    catch (error) {
        next(error);
    }
});
exports.authRoutes.post('/login', (0, validate_1.validateBody)(loginSchema), async (req, res, next) => {
    try {
        const session = await authService.login(req.body);
        res.json(session);
    }
    catch (error) {
        next(error);
    }
});
const forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().trim().email('Informe um e-mail válido.').max(160),
});
exports.authRoutes.post('/forgot-password', (0, validate_1.validateBody)(forgotPasswordSchema), async (req, res, next) => {
    try {
        const result = await authService.requestPasswordReset(req.body.email);
        res.json(result);
    }
    catch (error) {
        next(error);
    }
});
const resetPasswordSchema = zod_1.z.object({
    accessToken: zod_1.z.string().min(10, 'Link de redefinição inválido.'),
    password: zod_1.z.string().min(8, 'A nova senha deve ter ao menos 8 caracteres.').max(72),
});
exports.authRoutes.post('/reset-password', (0, validate_1.validateBody)(resetPasswordSchema), async (req, res, next) => {
    try {
        const result = await authService.resetPassword(req.body.accessToken, req.body.password);
        res.json(result);
    }
    catch (error) {
        next(error);
    }
});
exports.authRoutes.get('/me', auth_1.authenticate, (req, res) => {
    res.json({ user: req.user });
});
exports.authRoutes.post('/logout', (_req, res) => {
    res.status(204).end();
});
exports.authRoutes.get('/demo-accounts', (_req, res) => {
    if (!env_1.isDemo) {
        res
            .status(404)
            .json({ error: { code: 'NOT_FOUND', message: 'Recurso disponível apenas no modo demo.' } });
        return;
    }
    res.json({
        password: 'Demo@1234',
        accounts: [
            { email: 'admin@fih.com', role: 'superadmin', label: 'Equipe FIH · SuperAdmin' },
            { email: 'floricultura@jau.com', role: 'floricultura', label: 'Floricultura Rosa de Jaú' },
            { email: 'lab@senai.com', role: 'pesquisador_lab', label: 'Laboratório SENAI' },
            { email: 'cliente@embalagens.com', role: 'comercio_cliente', label: 'EcoEmbalagens B2B' },
        ],
    });
});
//# sourceMappingURL=auth.routes.js.map