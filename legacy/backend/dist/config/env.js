"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasSupabase = exports.isDemo = exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function readBoolean(value, fallback) {
    if (value === undefined || value.trim() === '')
        return fallback;
    return value.trim().toLowerCase() === 'true';
}
const supabaseUrl = (process.env.SUPABASE_URL ?? '').trim();
const supabaseAnonKey = (process.env.SUPABASE_ANON_KEY ?? '').trim();
const supabaseServiceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim();
const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey && supabaseServiceRoleKey);
const demoMode = readBoolean(process.env.DEMO_MODE, !hasSupabaseConfig);
if (!demoMode && !hasSupabaseConfig) {
    throw new Error('DEMO_MODE=false requer SUPABASE_URL, SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY configurados.');
}
exports.env = {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: Number(process.env.PORT ?? 3333),
    corsOrigins: (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    publicAppUrl: (process.env.PUBLIC_APP_URL ?? 'http://localhost:5173').replace(/\/$/, ''),
    jwtSecret: process.env.JWT_SECRET ?? 'dev-only-secret-change-me',
    supabaseUrl,
    supabaseAnonKey,
    supabaseServiceRoleKey,
    avatarsBucket: process.env.SUPABASE_AVATARS_BUCKET ?? 'avatars',
    evidenceBucket: process.env.SUPABASE_EVIDENCE_BUCKET ?? 'evidencias-lotes',
    signupAutoApprove: readBoolean(process.env.SIGNUP_AUTO_APPROVE, true),
};
exports.isDemo = demoMode;
exports.hasSupabase = hasSupabaseConfig;
//# sourceMappingURL=env.js.map