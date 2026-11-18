import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { env, isDemo } from '../config/env';
import { supabaseAdmin } from '../config/supabase';
import { ApiError } from '../errors';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function assertImage(file: Express.Multer.File | undefined, maxBytes: number) {
  if (!file) {
    throw new ApiError(400, 'FILE_REQUIRED', 'Envie uma imagem para continuar.');
  }
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    throw new ApiError(415, 'UNSUPPORTED_FILE', 'Formato inválido. Use JPG, PNG ou WEBP.');
  }
  if (file.size > maxBytes) {
    throw new ApiError(413, 'FILE_TOO_LARGE', 'A imagem excede o tamanho máximo permitido.');
  }
}

function extensionFor(file: Express.Multer.File) {
  if (EXTENSIONS[file.mimetype]) return EXTENSIONS[file.mimetype];
  return path.extname(file.originalname).replace('.', '').toLowerCase() || 'jpg';
}

export class StorageService {
  async uploadAvatar(userId: string, file: Express.Multer.File | undefined): Promise<string> {
    assertImage(file, 2 * 1024 * 1024);
    const image = file as Express.Multer.File;

    if (isDemo) {
      return `data:${image.mimetype};base64,${image.buffer.toString('base64')}`;
    }

    if (!supabaseAdmin) {
      throw new ApiError(500, 'CONFIG_ERROR', 'Supabase Storage não configurado.');
    }

    const filePath = `${userId}/avatar-${randomUUID()}.${extensionFor(image)}`;
    const { error } = await supabaseAdmin.storage
      .from(env.avatarsBucket)
      .upload(filePath, image.buffer, { contentType: image.mimetype, upsert: true });

    if (error) {
      throw new ApiError(500, 'STORAGE_ERROR', `Falha no upload do avatar: ${error.message}`);
    }

    const { data } = supabaseAdmin.storage.from(env.avatarsBucket).getPublicUrl(filePath);
    return `${data.publicUrl}?v=${Date.now()}`;
  }

  async uploadEvidence(batchId: string, file: Express.Multer.File | undefined): Promise<string> {
    assertImage(file, 5 * 1024 * 1024);
    const image = file as Express.Multer.File;

    if (isDemo) {
      return `data:${image.mimetype};base64,${image.buffer.toString('base64')}`;
    }

    if (!supabaseAdmin) {
      throw new ApiError(500, 'CONFIG_ERROR', 'Supabase Storage não configurado.');
    }

    const filePath = `batches/${batchId}/evidencia-${randomUUID()}.${extensionFor(image)}`;
    const { error } = await supabaseAdmin.storage
      .from(env.evidenceBucket)
      .upload(filePath, image.buffer, { contentType: image.mimetype, upsert: true });

    if (error) {
      throw new ApiError(500, 'STORAGE_ERROR', `Falha no upload da evidência: ${error.message}`);
    }

    const { data } = supabaseAdmin.storage.from(env.evidenceBucket).getPublicUrl(filePath);
    return `${data.publicUrl}?v=${Date.now()}`;
  }
}
