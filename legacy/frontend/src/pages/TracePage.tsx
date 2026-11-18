import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Beaker,
  Building2,
  CalendarDays,
  Download,
  ExternalLink,
  FlaskConical,
  Flower2,
  Gauge,
  Leaf,
  MapPin,
  PackageCheck,
  QrCode,
  Recycle,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Wind,
} from 'lucide-react';
import { Alert } from '../components/ui/Alert';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Field';
import { Logo } from '../components/ui/Logo';
import { Skeleton } from '../components/ui/Skeleton';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { useAuth } from '../contexts/AuthContext';
import { useApiData } from '../hooks/useApiData';
import { apiAssetUrl } from '../lib/api';
import { cn } from '../lib/cn';
import {
  formatDate,
  formatDateTime,
  formatDecimal,
  formatKg,
  formatNumber,
} from '../lib/format';
import { QUALITY_LABELS } from '../lib/status';
import type { TraceResult } from '../types';

function TraceSearch({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate();
  const [code, setCode] = useState('');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const normalized = code.trim().toUpperCase();
    if (!normalized) return;
    navigate(`/r/${encodeURIComponent(normalized)}`);
    setCode('');
  };

  return (
    <form onSubmit={submit} className={cn('flex gap-2', compact ? 'flex-row' : 'flex-col sm:flex-row')}>
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          placeholder="Ex.: PYTA1B2"
          className="pl-10 font-mono uppercase tracking-[0.12em]"
          aria-label="Código de rastreio"
          maxLength={24}
        />
      </div>
      <Button type="submit" icon={<QrCode className="h-4 w-4" />}>
        Rastrear
      </Button>
    </form>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  note,
  tone,
}: {
  icon: typeof Leaf;
  label: string;
  value: string;
  note: string;
  tone: string;
}) {
  return (
    <Card className="p-4">
      <span className={cn('grid h-9 w-9 place-items-center rounded-2xl', tone)}>
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-3 font-display text-2xl leading-none text-ink">{value}</p>
      <p className="mt-1.5 text-[11px] font-semibold text-ink">{label}</p>
      <p className="mt-1 text-[9px] leading-snug text-muted">{note}</p>
    </Card>
  );
}

export function TracePage() {
  const { code = '' } = useParams<{ code: string }>();
  const { user } = useAuth();
  const { data, loading, error, refresh } = useApiData<{ trace: TraceResult }>(
    code ? `/public/trace/${encodeURIComponent(code)}` : null,
  );

  const trace = data?.trace;
  const qrUrl = trace
    ? apiAssetUrl(`/public/trace/${encodeURIComponent(trace.batch.traceCode)}/qr.png`)
    : '';

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-line/70 bg-surface/70 backdrop-blur-xl">
        <div className="mx-auto flex h-[70px] max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Logo to={user ? '/app' : '/login'} />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to={user ? '/app' : '/login'}>
              <Button
                size="sm"
                variant="outline"
                iconRight={<ArrowRight className="h-3.5 w-3.5" />}
              >
                {user ? 'Abrir plataforma' : 'Entrar'}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6">
        {loading && !trace ? (
          <div className="space-y-5">
            <Skeleton className="h-80 w-full rounded-4xl" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-32 rounded-3xl" />
              ))}
            </div>
            <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
              <Skeleton className="h-96 rounded-3xl" />
              <Skeleton className="h-96 rounded-3xl" />
            </div>
          </div>
        ) : error || !trace ? (
          <div className="mx-auto max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="surface-card overflow-hidden"
            >
              <div className="bg-gradient-to-br from-stone-950 via-sage-950 to-stone-900 px-6 py-10 text-white">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-petal-300">
                  <QrCode className="h-7 w-7" />
                </span>
                <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.24em] text-petal-300">
                  Rastreabilidade circular
                </p>
                <h1 className="mt-2 font-display text-3xl leading-tight">
                  Não encontramos este código.
                </h1>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-white/55">
                  Confira se o QR Code foi lido por completo ou digite o código impresso na
                  embalagem para consultar a origem das pétalas e o impacto do lote.
                </p>
              </div>
              <div className="space-y-4 p-6">
                <Alert tone="error" title="Código não localizado">
                  {error ?? 'O código informado não existe ou o lote foi removido.'}
                </Alert>
                <TraceSearch />
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => void refresh()}>
                    Tentar novamente
                  </Button>
                  <Link to="/login">
                    <Button variant="ghost">Ir para a plataforma</Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="space-y-5">
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="relative overflow-hidden rounded-4xl bg-gradient-to-br from-stone-950 via-sage-950 to-stone-900 p-6 text-white shadow-soft sm:p-8"
            >
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-petal-500/25 blur-3xl" />
                <div className="absolute -bottom-28 left-1/4 h-72 w-72 rounded-full bg-sage-500/20 blur-3xl" />
                <div className="absolute inset-0 bg-grid opacity-[0.05]" />
              </div>

              <div className="relative z-10 grid gap-8 lg:grid-cols-[1.45fr_0.55fr] lg:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-sage-300/30 bg-sage-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-sage-200">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Rastreabilidade verificada
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold text-white/50">
                      <CalendarDays className="h-3 w-3" />
                      {formatDate(trace.batch.createdAt)}
                    </span>
                  </div>

                  <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.24em] text-petal-300">
                    Da pétala à embalagem
                  </p>
                  <h1 className="mt-2 font-display text-3xl leading-[1.06] text-white sm:text-4xl">
                    Uma embalagem com <em className="text-petal-300">história rastreável.</em>
                  </h1>
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/55">
                    Este lote nasceu de pétalas de rosas descartadas por floriculturas parceiras,
                    ganhou nova formulação no laboratório e chega ao comércio como bioplástico
                    biodegradável.
                  </p>

                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
                      {trace.batch.batchCode}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-white/20" />
                    <span className="text-[11px] text-white/55">{trace.batch.formulaVersion}</span>
                    <StatusBadge status={trace.batch.status} />
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-3 border-t border-white/10 pt-5">
                    <div>
                      <p className="font-display text-2xl leading-none text-sage-200">
                        {formatDecimal(trace.impact.petalsDivertedKg)} kg
                      </p>
                      <p className="mt-1 text-[9px] uppercase tracking-wide text-white/35">
                        pétalas desviadas
                      </p>
                    </div>
                    <div>
                      <p className="font-display text-2xl leading-none text-petal-200">
                        {formatDecimal(trace.impact.bioplasticProducedKg)} kg
                      </p>
                      <p className="mt-1 text-[9px] uppercase tracking-wide text-white/35">
                        bioplástico
                      </p>
                    </div>
                    <div>
                      <p className="font-display text-2xl leading-none text-white">
                        {formatDecimal(trace.impact.co2AvoidedKg)} kg
                      </p>
                      <p className="mt-1 text-[9px] uppercase tracking-wide text-white/35">
                        CO₂ evitado
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mx-auto w-full max-w-[250px]">
                  <div className="rounded-3xl bg-white p-4 text-center text-stone-900 shadow-soft">
                    <img
                      src={qrUrl}
                      alt={`QR Code de rastreabilidade do lote ${trace.batch.batchCode}`}
                      className="mx-auto h-48 w-48"
                    />
                    <p className="mt-2 text-[9px] font-bold uppercase tracking-[0.22em] text-stone-400">
                      Código de rastreio
                    </p>
                    <p className="font-mono text-lg font-bold tracking-[0.2em] text-stone-900">
                      {trace.batch.traceCode}
                    </p>
                    <a
                      href={qrUrl}
                      download={`qr-${trace.batch.traceCode}.png`}
                      className="focus-ring mt-3 inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-stone-200 px-3.5 text-[11px] font-semibold text-stone-700 transition hover:border-sage-300 hover:bg-sage-50"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Baixar QR Code
                    </a>
                  </div>
                  <p className="mt-2 text-center text-[10px] text-white/35">
                    Escaneie para abrir esta página em qualquer aparelho.
                  </p>
                </div>
              </div>
            </motion.section>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <MetricCard
                icon={Flower2}
                label="Pétalas desviadas"
                value={formatKg(trace.impact.petalsDivertedKg)}
                note="Biomassa floral fora de aterros"
                tone="bg-petal-100 text-petal-700 dark:bg-petal-900/40 dark:text-petal-300"
              />
              <MetricCard
                icon={FlaskConical}
                label="Bioplástico gerado"
                value={formatKg(trace.impact.bioplasticProducedKg)}
                note="Rendimento produtivo do lote"
                tone="bg-sage-100 text-sage-700 dark:bg-sage-900/40 dark:text-sage-300"
              />
              <MetricCard
                icon={Recycle}
                label="Plástico fóssil evitado"
                value={formatKg(trace.impact.fossilPlasticAvoidedKg)}
                note="Substituição estimada 1:1"
                tone="bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300"
              />
              <MetricCard
                icon={Wind}
                label="CO₂ evitado"
                value={formatKg(trace.impact.co2AvoidedKg)}
                note="Equivalência estimada de emissões"
                tone="bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300"
              />
              <MetricCard
                icon={ShoppingBag}
                label="Sacolas substituídas"
                value={formatNumber(trace.impact.bagsEquivalent)}
                note="Equivalência em sacolas de 5 g"
                tone="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
              />
            </div>

            <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
              <div className="space-y-5">
                <Card className="p-5 sm:p-6">
                  <CardHeader
                    title="A jornada deste lote"
                    description="Cada etapa foi registrada na plataforma e pode ser auditada."
                    icon={<Sparkles className="h-5 w-5" />}
                  />
                  <div className="mt-5">
                    {trace.timeline.map((item, index) => (
                      <div key={`${item.title}-${index}`} className="relative flex gap-3.5 pb-5 last:pb-0">
                        {index < trace.timeline.length - 1 && (
                          <span className="absolute bottom-0 left-[17px] top-9 w-px bg-line" />
                        )}
                        <span
                          className={cn(
                            'relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full border text-[10px] font-bold',
                            index === 0
                              ? 'border-petal-200 bg-petal-100 text-petal-700 dark:border-petal-800 dark:bg-petal-900/40 dark:text-petal-200'
                              : index === trace.timeline.length - 1
                                ? 'border-sage-200 bg-sage-100 text-sage-700 dark:border-sage-800 dark:bg-sage-900/40 dark:text-sage-200'
                                : 'border-line bg-canvas text-muted',
                          )}
                        >
                          {index === trace.timeline.length - 1 ? (
                            <Leaf className="h-4 w-4" />
                          ) : (
                            `0${index + 1}`
                          )}
                        </span>
                        <div className="min-w-0 flex-1 pt-0.5">
                          <div className="flex flex-wrap items-center justify-between gap-1.5">
                            <h3 className="text-sm font-semibold text-ink">{item.title}</h3>
                            <span className="text-[10px] text-muted">
                              {item.date ? formatDate(item.date) : 'Impacto contínuo'}
                            </span>
                          </div>
                          <p className="mt-1 text-xs leading-relaxed text-muted">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-5 sm:p-6">
                  <CardHeader
                    title="Ficha técnica do bioplástico"
                    description="Parâmetros declarados pelo laboratório responsável."
                    icon={<Beaker className="h-5 w-5" />}
                    action={<StatusBadge status={trace.batch.status} />}
                  />
                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-canvas/70 p-3.5">
                      <FlaskConical className="h-4 w-4 text-sage-600 dark:text-sage-300" />
                      <p className="mt-1.5 text-[9px] uppercase tracking-wide text-muted">
                        formulação
                      </p>
                      <p className="mt-0.5 text-xs font-semibold text-ink">
                        {trace.batch.formulaVersion}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-canvas/70 p-3.5">
                      <PackageCheck className="h-4 w-4 text-sage-600 dark:text-sage-300" />
                      <p className="mt-1.5 text-[9px] uppercase tracking-wide text-muted">
                        peso produzido
                      </p>
                      <p className="mt-0.5 text-xs font-semibold text-ink">
                        {formatKg(trace.batch.weightProducedKg)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-canvas/70 p-3.5">
                      <Leaf className="h-4 w-4 text-sage-600 dark:text-sage-300" />
                      <p className="mt-1.5 text-[9px] uppercase tracking-wide text-muted">
                        biodegradação
                      </p>
                      <p className="mt-0.5 text-xs font-semibold text-ink">
                        {trace.batch.biodegradationDays} dias em solo
                      </p>
                    </div>
                    <div className="rounded-2xl bg-canvas/70 p-3.5">
                      <Gauge className="h-4 w-4 text-petal-600 dark:text-petal-300" />
                      <p className="mt-1.5 text-[9px] uppercase tracking-wide text-muted">
                        resistência à tração
                      </p>
                      <p className="mt-0.5 text-xs font-semibold text-ink">
                        {formatDecimal(trace.batch.tensileStrength)} MPa
                      </p>
                    </div>
                    <div className="rounded-2xl bg-canvas/70 p-3.5">
                      <CalendarDays className="h-4 w-4 text-muted" />
                      <p className="mt-1.5 text-[9px] uppercase tracking-wide text-muted">
                        registro do lote
                      </p>
                      <p className="mt-0.5 text-xs font-semibold text-ink">
                        {formatDateTime(trace.batch.createdAt)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-canvas/70 p-3.5">
                      <QrCode className="h-4 w-4 text-muted" />
                      <p className="mt-1.5 text-[9px] uppercase tracking-wide text-muted">
                        código público
                      </p>
                      <p className="mt-0.5 font-mono text-xs font-semibold tracking-[0.12em] text-ink">
                        {trace.batch.traceCode}
                      </p>
                    </div>
                  </div>

                  {trace.batch.evidenceUrl && (
                    <a
                      href={trace.batch.evidenceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="focus-ring mt-4 inline-flex h-10 items-center gap-2 rounded-full border border-line px-4 text-xs font-semibold text-ink transition hover:border-sage-300 hover:bg-sage-50 dark:hover:border-sage-700 dark:hover:bg-sage-900/20"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Ver evidência de qualidade
                    </a>
                  )}
                </Card>
              </div>

              <div className="space-y-5">
                <Card className="p-5">
                  <CardHeader
                    title="Origem das pétalas"
                    description="A flor que virou matéria-prima."
                    icon={<Flower2 className="h-5 w-5" />}
                  />
                  {trace.origin ? (
                    <div className="mt-4 space-y-3">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted">
                          floricultura
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-ink">
                          {trace.origin.organizationName}
                        </p>
                        <p className="text-[11px] text-muted">
                          {trace.origin.floristName} · {trace.origin.city}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 border-t border-line/70 pt-3">
                        <div>
                          <p className="text-[9px] uppercase tracking-wide text-muted">pétalas</p>
                          <p className="mt-0.5 text-sm font-semibold text-ink">
                            {formatKg(trace.origin.petalWeightKg)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase tracking-wide text-muted">qualidade</p>
                          <p className="mt-0.5 text-sm font-semibold text-ink">
                            {QUALITY_LABELS[trace.origin.qualityStatus]}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-1.5 border-t border-line/70 pt-3 text-[11px] text-muted">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>Retirada registrada até {formatDate(trace.origin.pickupDate)}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-muted">
                      Este lote não possui uma coleta de origem vinculada.
                    </p>
                  )}
                </Card>

                <Card className="p-5">
                  <CardHeader
                    title="Pesquisa e produção"
                    description="Quem transformou as pétalas."
                    icon={<FlaskConical className="h-5 w-5" />}
                  />
                  {trace.researcher ? (
                    <div className="mt-4 space-y-2.5">
                      <div className="flex items-start gap-2.5">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sage-100 text-sage-700 dark:bg-sage-900/40 dark:text-sage-300">
                          <Beaker className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-ink">{trace.researcher.name}</p>
                          <p className="text-[11px] text-muted">
                            {trace.researcher.organizationName}
                          </p>
                        </div>
                      </div>
                      <p className="text-[11px] leading-relaxed text-muted">
                        Formulação desenvolvida em laboratório parceiro do projeto Plastikkimik
                        Pytangy, com registro de parâmetros técnicos e QR Code público por lote.
                      </p>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-muted">Pesquisador não informado.</p>
                  )}
                </Card>

                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sage-700 via-sage-800 to-petal-900 p-5 text-white shadow-soft">
                  <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full border border-white/10" />
                  <div className="relative z-10">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-white/75">
                      <ShieldCheck className="h-3 w-3" />
                      Consumo consciente
                    </span>
                    <p className="mt-3 font-display text-xl leading-tight">
                      Cada escolha fecha um ciclo.
                    </p>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-white/60">
                      Ao optar por embalagens de pétalas, seu negócio reduz plástico fóssil, desvia
                      resíduos de aterros e valoriza a produção local.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-semibold text-white/75">
                        ODS 12
                      </span>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-semibold text-white/75">
                        ODS 14
                      </span>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-semibold text-white/75">
                        ODS 15
                      </span>
                    </div>
                  </div>
                </div>

                <Card className="p-5">
                  <CardHeader
                    title="Consultar outro lote"
                    description="Digite o código impresso na embalagem."
                    icon={<QrCode className="h-5 w-5" />}
                  />
                  <div className="mt-4">
                    <TraceSearch compact />
                  </div>
                </Card>
              </div>
            </div>

            <p className="rounded-2xl border border-line/70 bg-surface/60 px-4 py-3 text-center text-[10px] leading-relaxed text-muted">
              Impacto calculado com fatores estimados do MVP: 0,3 kg de bioplástico por kg de
              pétalas, 1 kg de plástico fóssil evitado por kg de bioplástico, sacolas de 5 g e 3,2
              kg de CO₂ evitado por kg de bioplástico. Dados públicos não incluem contato ou
              endereço das organizações.
            </p>
          </div>
        )}
      </main>

      <footer className="border-t border-line/70 bg-surface/50">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-[11px] text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1.5 font-semibold text-ink">
              <Leaf className="h-3.5 w-3.5 text-sage-600 dark:text-sage-300" />
              Plastikkimik Pytangy
            </span>
            <span>Equipe FIH · Jaú/SP</span>
            <span>INTEGRA SENAI 2026</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              Bioplástico de pétalas de rosas
            </span>
            <Link
              to={user ? '/app' : '/login'}
              className="font-semibold text-sage-700 underline-offset-4 hover:underline dark:text-sage-300"
            >
              {user ? 'Abrir plataforma' : 'Entrar na plataforma'}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
