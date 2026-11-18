import { Download, Leaf, ShieldCheck } from 'lucide-react';
import type { ImpactMetrics, Profile } from '../types';
import { formatDecimal, formatNumber } from '../lib/format';
import { Button } from './ui/Button';

function buildSealSvg(profile: Profile, impact: ImpactMetrics): string {
  const escapedName = profile.organizationName
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const code = `PYT-${profile.id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
  const date = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="620" viewBox="0 0 1000 620">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1f3e2b"/>
      <stop offset="55%" stop-color="#2a5a3b"/>
      <stop offset="100%" stop-color="#6c352e"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#f6d3cc"/>
      <stop offset="100%" stop-color="#efb3a8"/>
    </linearGradient>
  </defs>
  <rect width="1000" height="620" rx="48" fill="url(#bg)"/>
  <circle cx="880" cy="80" r="220" fill="#ffffff" opacity="0.04"/>
  <circle cx="120" cy="560" r="180" fill="#ffffff" opacity="0.04"/>
  <rect x="36" y="36" width="928" height="548" rx="34" fill="none" stroke="#ffffff" stroke-opacity="0.18" stroke-width="2"/>
  <text x="80" y="118" fill="#efb3a8" font-family="Georgia, serif" font-size="28" letter-spacing="8">PLASTIKKIMIK PYTANGY</text>
  <text x="80" y="215" fill="#ffffff" font-family="Georgia, serif" font-size="64" font-weight="bold">Selo Pétala Circular</text>
  <text x="80" y="265" fill="#ffffff" opacity="0.65" font-family="Arial, sans-serif" font-size="24">Sustentabilidade verificada · ODS 12 · 14 · 15</text>
  <text x="80" y="355" fill="#c2dfc8" font-family="Arial, sans-serif" font-size="20" letter-spacing="4">CONCEDIDO A</text>
  <text x="80" y="402" fill="#ffffff" font-family="Georgia, serif" font-size="42">${escapedName}</text>
  <text x="80" y="462" fill="#c2dfc8" font-family="Arial, sans-serif" font-size="18" letter-spacing="3">IMPACTO ACUMULADO</text>
  <text x="80" y="512" fill="#ffffff" font-family="Arial, sans-serif" font-size="30" font-weight="bold">${formatDecimal(impact.fossilPlasticAvoidedKg)} kg de plástico fóssil evitado · ${formatNumber(impact.bagsEquivalent)} sacolas substituídas</text>
  <text x="80" y="548" fill="#ffffff" opacity="0.55" font-family="Arial, sans-serif" font-size="18">${code} · emitido em ${date} · vinculado ao QR Code de cada lote</text>
  <g transform="translate(790 380)">
    <circle cx="70" cy="70" r="86" fill="none" stroke="#efb3a8" stroke-width="3" stroke-dasharray="6 8"/>
    <text x="70" y="58" text-anchor="middle" fill="#efb3a8" font-family="Georgia, serif" font-size="26">100%</text>
    <text x="70" y="84" text-anchor="middle" fill="#ffffff" opacity="0.7" font-family="Arial, sans-serif" font-size="13">RASTREÁVEL</text>
    <text x="70" y="104" text-anchor="middle" fill="#ffffff" opacity="0.7" font-family="Arial, sans-serif" font-size="13">POR QR CODE</text>
  </g>
</svg>`;
}

export function SustainabilitySeal({
  profile,
  impact,
}: {
  profile: Profile;
  impact: ImpactMetrics;
}) {
  const download = () => {
    const svg = buildSealSvg(profile, impact);
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `selo-petala-circular-${profile.organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')}.svg`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sage-800 via-sage-700 to-petal-900 p-5 text-white shadow-soft">
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full border border-white/10" />
      <div className="pointer-events-none absolute -bottom-24 -left-10 h-48 w-48 rounded-full border border-white/10" />
      <div className="relative z-10">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-white/75">
            <ShieldCheck className="h-3 w-3" />
            Selo verificado
          </span>
          <Leaf className="h-4 w-4 text-sage-200" />
        </div>
        <p className="mt-4 font-display text-2xl leading-tight">Selo Pétala Circular</p>
        <p className="mt-1 truncate text-sm text-white/60">{profile.organizationName}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/10 pt-3 text-white/80">
          <div>
            <p className="text-lg font-bold text-white">
              {formatDecimal(impact.fossilPlasticAvoidedKg)} kg
            </p>
            <p className="text-[10px] text-white/45">plástico fóssil evitado</p>
          </div>
          <div>
            <p className="text-lg font-bold text-white">{formatNumber(impact.bagsEquivalent)}</p>
            <p className="text-[10px] text-white/45">sacolas substituídas</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={download}
          icon={<Download className="h-3.5 w-3.5" />}
          className="mt-4 border-white/20 bg-white/10 text-white hover:border-white/40 hover:bg-white/15"
        >
          Baixar selo digital
        </Button>
      </div>
    </div>
  );
}
