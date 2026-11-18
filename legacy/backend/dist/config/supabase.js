"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabasePublic = exports.supabaseAdmin = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const env_1 = require("./env");
/**
 * Cliente com service role: usado apenas no servidor para operações de
 * persistência, Storage e administração de usuários. Nunca exponha esta chave
 * ao frontend.
 */
exports.supabaseAdmin = env_1.isDemo
    ? null
    : (0, supabase_js_1.createClient)(env_1.env.supabaseUrl, env_1.env.supabaseServiceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
/**
 * Cliente anônimo: usado para login e validação de tokens JWT emitidos pelo
 * Supabase Auth.
 */
exports.supabasePublic = env_1.isDemo
    ? null
    : (0, supabase_js_1.createClient)(env_1.env.supabaseUrl, env_1.env.supabaseAnonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
//# sourceMappingURL=supabase.js.map