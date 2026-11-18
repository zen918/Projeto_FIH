import crypto from 'node:crypto';

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string | null | undefined): boolean {
  if (!stored) return false;
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;

  const expected = Buffer.from(hash, 'hex');
  const actual = crypto.scryptSync(password, salt, 64);
  if (expected.length !== actual.length) return false;

  return crypto.timingSafeEqual(expected, actual);
}

/** Código curto e legível para o QR Code de rastreabilidade (8 caracteres). */
export function generateTraceCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

/** Código de lote legível no formato LOTE-YYMMDD-XXXX. */
export function generateBatchCode(): string {
  const now = new Date();
  const stamp = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate(),
  ).padStart(2, '0')}`;
  const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `LOTE-${stamp}-${suffix}`;
}
