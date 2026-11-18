const {
  ROLE_LABELS,
  ROLE_SHORT_LABELS,
  PACKAGING_LABELS,
  QUALITY_LABELS,
  STATUS_META,
} = require('../config/constants');

const numberFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
const integerFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });

function number(value, digits = 2) {
  const parsed = Number(value || 0);
  if (!Number.isFinite(parsed)) return '0';
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: digits }).format(parsed);
}

function integer(value) {
  return integerFormatter.format(Number(value || 0));
}

function kg(value, digits = 1) {
  return `${number(value, digits)} kg`;
}

function percent(part, total) {
  if (!total) return 0;
  return Math.max(0, Math.min(100, Math.round((Number(part || 0) / Number(total)) * 100)));
}

function date(value) {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function dateTime(value) {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function timeAgo(value) {
  if (!value) return '—';
  const target = new Date(value).getTime();
  if (Number.isNaN(target)) return '—';
  const diff = target - Date.now();
  const abs = Math.abs(diff);
  const minutes = Math.round(abs / 60000);
  const hours = Math.round(abs / 3600000);
  const days = Math.round(abs / 86400000);
  const future = diff > 0;

  let text;
  if (minutes < 1) text = 'agora';
  else if (minutes < 60) text = `${minutes} min`;
  else if (hours < 24) text = `${hours} h`;
  else if (days < 30) text = `${days} ${days === 1 ? 'dia' : 'dias'}`;
  else {
    const months = Math.round(days / 30);
    text = `${months} ${months === 1 ? 'mês' : 'meses'}`;
  }

  if (text === 'agora') return text;
  return future ? `em ${text}` : `há ${text}`;
}

function firstName(name) {
  return String(name || '').trim().split(/\s+/)[0] || 'Olá';
}

function initials(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function roleLabel(role) {
  return ROLE_LABELS[role] || role || '—';
}

function roleShort(role) {
  return ROLE_SHORT_LABELS[role] || role || '—';
}

function packagingLabel(type) {
  return PACKAGING_LABELS[type] || type || '—';
}

function qualityLabel(quality) {
  return QUALITY_LABELS[quality] || quality || '—';
}

function statusMeta(status) {
  return STATUS_META[status] || { label: status || '—', tone: 'muted' };
}

function statusLabel(status) {
  return statusMeta(status).label;
}

function statusTone(status) {
  return statusMeta(status).tone;
}

function todayInput() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
}

function monthLabel(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value || '');
  return parsed.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
}

function percentWidth(value, max) {
  if (!max) return 0;
  const pct = Math.round((Number(value || 0) / Number(max)) * 100);
  return Math.max(pct > 0 ? 6 : 0, Math.min(100, pct));
}

const helpers = {
  number,
  integer,
  kg,
  percent,
  percentWidth,
  date,
  dateTime,
  timeAgo,
  firstName,
  initials,
  roleLabel,
  roleShort,
  packagingLabel,
  qualityLabel,
  statusMeta,
  statusLabel,
  statusTone,
  todayInput,
  monthLabel,
};

module.exports = helpers;
