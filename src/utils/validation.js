const crypto = require('node:crypto');

function clean(value, max = 500) {
  return String(value ?? '').trim().slice(0, max);
}

function email(value) {
  const normalized = clean(value, 160).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : null;
}

function positiveNumber(value, max = 100000) {
  const normalized = String(value ?? '').replace(',', '.');
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > max) return null;
  return Math.round(parsed * 1000) / 1000;
}

function integerNumber(value, min = 0, max = 3650) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) return null;
  return parsed;
}

function isoDate(value) {
  const normalized = clean(value, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return null;
  const parsed = new Date(`${normalized}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return normalized;
}

function oneOf(value, allowed, fallback = null) {
  return allowed.includes(value) ? value : fallback;
}

function uuid() {
  return crypto.randomUUID();
}

function token(bytes = 24) {
  return crypto.randomBytes(bytes).toString('hex');
}

function traceCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let index = 0; index < 6; index += 1) {
    code += alphabet[crypto.randomInt(0, alphabet.length)];
  }
  return `PYTA${code}`;
}

function batchCode() {
  const now = new Date();
  const stamp = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  return `LOTE-${stamp}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
}

module.exports = {
  clean,
  email,
  positiveNumber,
  integerNumber,
  isoDate,
  oneOf,
  uuid,
  token,
  traceCode,
  batchCode,
};
