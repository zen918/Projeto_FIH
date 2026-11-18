"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const supabase_1 = require("../config/supabase");
const contracts_1 = require("../repositories/contracts");
const repositories_1 = require("../repositories");
const errors_1 = require("../errors");
const authenticate = async (req, _res, next) => {
    try {
        const header = req.header('authorization');
        if (!header || !header.startsWith('Bearer ')) {
            throw (0, errors_1.unauthorized)('Envie o token de acesso no cabeçalho Authorization.');
        }
        const token = header.slice('Bearer '.length).trim();
        if (!token)
            throw (0, errors_1.unauthorized)('Token de acesso ausente.');
        let userId;
        if (env_1.isDemo) {
            let payload;
            try {
                payload = jsonwebtoken_1.default.verify(token, env_1.env.jwtSecret);
            }
            catch {
                throw (0, errors_1.unauthorized)('Sessão expirada ou inválida. Faça login novamente.');
            }
            if (!payload.sub)
                throw (0, errors_1.unauthorized)('Token de acesso inválido.');
            userId = payload.sub;
        }
        else {
            if (!supabase_1.supabasePublic) {
                throw (0, errors_1.unauthorized)('Supabase Auth não configurado no servidor.');
            }
            const { data, error } = await supabase_1.supabasePublic.auth.getUser(token);
            if (error || !data.user) {
                throw (0, errors_1.unauthorized)('Sessão expirada ou inválida. Faça login novamente.');
            }
            userId = data.user.id;
        }
        const record = await repositories_1.store.findUserById(userId);
        if (!record)
            throw (0, errors_1.unauthorized)('Perfil não encontrado.');
        const user = (0, contracts_1.toProfile)(record);
        if (user.status === 'pending') {
            throw (0, errors_1.forbidden)('Sua conta ainda está em análise pela equipe FIH. Aguarde a aprovação.', 'ACCOUNT_PENDING');
        }
        if (user.status === 'blocked') {
            throw (0, errors_1.forbidden)('Sua conta está bloqueada. Fale com a equipe FIH.', 'ACCOUNT_BLOCKED');
        }
        req.user = user;
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.authenticate = authenticate;
//# sourceMappingURL=auth.js.map