"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const node_path_1 = __importDefault(require("node:path"));
const node_crypto_1 = require("node:crypto");
const env_1 = require("../config/env");
const supabase_1 = require("../config/supabase");
const errors_1 = require("../errors");
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const EXTENSIONS = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
};
function assertImage(file, maxBytes) {
    if (!file) {
        throw new errors_1.ApiError(400, 'FILE_REQUIRED', 'Envie uma imagem para continuar.');
    }
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
        throw new errors_1.ApiError(415, 'UNSUPPORTED_FILE', 'Formato inválido. Use JPG, PNG ou WEBP.');
    }
    if (file.size > maxBytes) {
        throw new errors_1.ApiError(413, 'FILE_TOO_LARGE', 'A imagem excede o tamanho máximo permitido.');
    }
}
function extensionFor(file) {
    if (EXTENSIONS[file.mimetype])
        return EXTENSIONS[file.mimetype];
    return node_path_1.default.extname(file.originalname).replace('.', '').toLowerCase() || 'jpg';
}
class StorageService {
    async uploadAvatar(userId, file) {
        assertImage(file, 2 * 1024 * 1024);
        const image = file;
        if (env_1.isDemo) {
            return `data:${image.mimetype};base64,${image.buffer.toString('base64')}`;
        }
        if (!supabase_1.supabaseAdmin) {
            throw new errors_1.ApiError(500, 'CONFIG_ERROR', 'Supabase Storage não configurado.');
        }
        const filePath = `${userId}/avatar-${(0, node_crypto_1.randomUUID)()}.${extensionFor(image)}`;
        const { error } = await supabase_1.supabaseAdmin.storage
            .from(env_1.env.avatarsBucket)
            .upload(filePath, image.buffer, { contentType: image.mimetype, upsert: true });
        if (error) {
            throw new errors_1.ApiError(500, 'STORAGE_ERROR', `Falha no upload do avatar: ${error.message}`);
        }
        const { data } = supabase_1.supabaseAdmin.storage.from(env_1.env.avatarsBucket).getPublicUrl(filePath);
        return `${data.publicUrl}?v=${Date.now()}`;
    }
    async uploadEvidence(batchId, file) {
        assertImage(file, 5 * 1024 * 1024);
        const image = file;
        if (env_1.isDemo) {
            return `data:${image.mimetype};base64,${image.buffer.toString('base64')}`;
        }
        if (!supabase_1.supabaseAdmin) {
            throw new errors_1.ApiError(500, 'CONFIG_ERROR', 'Supabase Storage não configurado.');
        }
        const filePath = `batches/${batchId}/evidencia-${(0, node_crypto_1.randomUUID)()}.${extensionFor(image)}`;
        const { error } = await supabase_1.supabaseAdmin.storage
            .from(env_1.env.evidenceBucket)
            .upload(filePath, image.buffer, { contentType: image.mimetype, upsert: true });
        if (error) {
            throw new errors_1.ApiError(500, 'STORAGE_ERROR', `Falha no upload da evidência: ${error.message}`);
        }
        const { data } = supabase_1.supabaseAdmin.storage.from(env_1.env.evidenceBucket).getPublicUrl(filePath);
        return `${data.publicUrl}?v=${Date.now()}`;
    }
}
exports.StorageService = StorageService;
//# sourceMappingURL=storage.service.js.map