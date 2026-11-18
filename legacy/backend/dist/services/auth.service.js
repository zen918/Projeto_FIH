"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const supabase_1 = require("../config/supabase");
const errors_1 = require("../errors");
const repositories_1 = require("../repositories");
const contracts_1 = require("../repositories/contracts");
const crypto_1 = require("../utils/crypto");
const SELF_SERVICE_ROLES = ['floricultura', 'comercio_cliente', 'pesquisador_lab'];
function signDemoToken(user) {
    return jsonwebtoken_1.default.sign({ sub: user.id, role: user.role, demo: true }, env_1.env.jwtSecret, {
        expiresIn: '7d',
    });
}
function assertCanSignIn(user) {
    if (user.status === 'pending') {
        throw new errors_1.ApiError(403, 'ACCOUNT_PENDING', 'Sua conta está em análise pela equipe FIH. Você poderá entrar assim que for aprovada.');
    }
    if (user.status === 'blocked') {
        throw new errors_1.ApiError(403, 'ACCOUNT_BLOCKED', 'Sua conta foi bloqueada. Entre em contato com a equipe FIH para mais informações.');
    }
}
class AuthService {
    async login(input) {
        const email = input.email.trim().toLowerCase();
        if (env_1.isDemo) {
            const record = await repositories_1.store.findUserByEmail(email);
            if (!record || !(0, crypto_1.verifyPassword)(input.password, record.passwordHash)) {
                throw (0, errors_1.unauthorized)('E-mail ou senha inválidos.');
            }
            const user = (0, contracts_1.toProfile)(record);
            assertCanSignIn(user);
            return { token: signDemoToken(user), user, pending: false, demo: true };
        }
        const client = supabase_1.supabasePublic;
        if (!client)
            throw new errors_1.ApiError(500, 'CONFIG_ERROR', 'Supabase Auth não configurado.');
        const { data, error } = await client.auth.signInWithPassword({ email, password: input.password });
        if (error || !data.user) {
            throw (0, errors_1.unauthorized)('E-mail ou senha inválidos.');
        }
        const record = await repositories_1.store.findUserById(data.user.id);
        if (!record) {
            throw new errors_1.ApiError(500, 'PROFILE_NOT_FOUND', 'Seu perfil ainda não foi criado. Fale com o suporte da FIH.');
        }
        const user = (0, contracts_1.toProfile)(record);
        assertCanSignIn(user);
        return { token: data.session?.access_token ?? null, user, pending: false, demo: false };
    }
    async signup(input) {
        if (!SELF_SERVICE_ROLES.includes(input.role)) {
            throw (0, errors_1.forbidden)('Perfil inválido para cadastro público.');
        }
        const email = input.email.trim().toLowerCase();
        const existing = await repositories_1.store.findUserByEmail(email);
        if (existing) {
            throw (0, errors_1.conflict)('Este e-mail já está cadastrado. Faça login para continuar.', 'EMAIL_ALREADY_EXISTS');
        }
        const status = env_1.env.signupAutoApprove ? 'active' : 'pending';
        let record;
        try {
            record = await repositories_1.store.createUser({
                fullName: input.fullName,
                email,
                password: input.password,
                role: input.role,
                status,
                organizationName: input.organizationName,
                city: input.city,
                phone: input.phone,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : '';
            if (/EMAIL_ALREADY_EXISTS|already|registered|exists/i.test(message)) {
                throw (0, errors_1.conflict)('Este e-mail já está cadastrado. Faça login para continuar.', 'EMAIL_ALREADY_EXISTS');
            }
            throw new errors_1.ApiError(500, 'SIGNUP_FAILED', 'Não foi possível criar sua conta. Tente novamente.');
        }
        const user = (0, contracts_1.toProfile)(record);
        if (env_1.isDemo) {
            if (status === 'pending') {
                return { token: null, user, pending: true, demo: true };
            }
            return { token: signDemoToken(user), user, pending: false, demo: true };
        }
        if (status === 'pending') {
            return { token: null, user, pending: true, demo: false };
        }
        const client = supabase_1.supabasePublic;
        if (!client)
            throw new errors_1.ApiError(500, 'CONFIG_ERROR', 'Supabase Auth não configurado.');
        const { data, error } = await client.auth.signInWithPassword({
            email,
            password: input.password,
        });
        if (error || !data.session) {
            throw new errors_1.ApiError(500, 'SIGNUP_SESSION_FAILED', 'Conta criada, mas não foi possível iniciar a sessão. Faça login.');
        }
        return {
            token: data.session.access_token,
            user,
            pending: false,
            demo: false,
        };
    }
    async me(userId) {
        const record = await repositories_1.store.findUserById(userId);
        if (!record)
            throw (0, errors_1.unauthorized)('Perfil não encontrado.');
        const user = (0, contracts_1.toProfile)(record);
        assertCanSignIn(user);
        return user;
    }
    async requestPasswordReset(email) {
        if (env_1.isDemo) {
            return {
                demo: true,
                message: 'O modo demonstração não envia e-mails. Use a senha Demo@1234 nas contas de exemplo ou crie uma nova conta.',
            };
        }
        const client = supabase_1.supabasePublic;
        if (!client)
            throw new errors_1.ApiError(500, 'CONFIG_ERROR', 'Supabase Auth não configurado.');
        const { error } = await client.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
            redirectTo: `${env_1.env.publicAppUrl}/redefinir-senha`,
        });
        if (error) {
            console.warn('[auth] falha ao solicitar redefinição de senha:', error.message);
        }
        return {
            demo: false,
            message: 'Se existir uma conta com este e-mail, enviaremos um link seguro para redefinição da senha. Verifique também a caixa de spam.',
        };
    }
    async resetPassword(accessToken, password) {
        if (env_1.isDemo) {
            throw new errors_1.ApiError(400, 'DEMO_MODE', 'A redefinição de senha por e-mail está disponível apenas com o Supabase Auth configurado.');
        }
        const client = supabase_1.supabasePublic;
        const admin = supabase_1.supabaseAdmin;
        if (!client || !admin) {
            throw new errors_1.ApiError(500, 'CONFIG_ERROR', 'Supabase Auth não configurado.');
        }
        const { data, error } = await client.auth.getUser(accessToken);
        if (error || !data.user) {
            throw (0, errors_1.unauthorized)('Link de redefinição inválido ou expirado. Solicite um novo.');
        }
        const { error: updateError } = await admin.auth.admin.updateUserById(data.user.id, {
            password,
        });
        if (updateError) {
            throw new errors_1.ApiError(500, 'PASSWORD_RESET_FAILED', 'Não foi possível atualizar a senha. Tente novamente.');
        }
        return { message: 'Senha atualizada com sucesso. Faça login com a nova senha.' };
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map