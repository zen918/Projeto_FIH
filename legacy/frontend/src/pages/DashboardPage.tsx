import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowUpRight,
  Calculator,
  CloudSun,
  FlaskConical,
  Flower2,
  Leaf,
  PackageCheck,
  Recycle,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Alert } from '../components/ui/Alert';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { Skeleton, SkeletonCard } from '../components/ui/Skeleton';
import { ImpactChart } from '../components/ImpactChart';
import { SustainabilitySeal } from '../components/SustainabilitySeal';
import { useAuth } from '../contexts/AuthContext';
import { useApiData } from '../hooks/useApiData';
import {
  formatCompact,
  formatDecimal,
  formatKg,
  formatNumber,
  firstName,
  timeAgo,
} from '../lib/format';
import { QUICK_ACTIONS } from '../lib/navigation';
import { ROLE_LABELS, STATUS_META } from '../lib/status';
import type {
  BioplasticBatch,
  ImpactResponse,
  Order,
  PetalCollection,
  Role,
} from '../types';

const SCOPE_COPY: Record<Role, { label: string; headline: string; description: string }> = {
  superadmin: {
    label: 'Visão 360º da cadeia',
    headline: 'Toda a operação circular, em um só painel.',
    description:
      'Acompanhe o impacto global, aprove contas e garanta a rastreabilidade de cada lote produzido pela equipe FIH.',
  },
  floricultura: {
    label: 'Sua biomassa virou valor',
    headline: 'Cada pétala registrada inicia um novo ciclo.',
    description:
      'Registre disponibilidade, acompanhe as coletas e veja o bioplástico que nasceu das pétalas da sua floricultura.',
  },
  pesquisador_lab: {
    label: 'Ciência que fecha o ciclo',
    headline: 'Seus lotes conectam resíduos a embalagens.',
    description:
      'Controle formulações, evidências de qualidade e QR Codes de rastreabilidade de cada lote de bioplástico.',
  },
  comercio_cliente: {
    label: 'Sua marca dentro do ciclo',
    headline: 'Cada pedido reduz plástico fóssil.',
    description:
      'Explore o catálogo, acompanhe entregas e emita o selo digital de sustentabilidade da sua marca.',
  },
};

interface ActivityItem {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  date: string;
}

export function DashboardPage() {
  const { user } = useAuth();
  const role = user?.role ?? 'floricultura';
  const quick = QUICK_ACTIONS[role];
  const scope = SCOPE_COPY[role];

  const {
    data: impactData,
    loading,
    error,
    refresh,
  } = useApiData<{ impact: ImpactResponse }>('/impact');
  const { data: collectionsData } = useApiData<{ collections: PetalCollection[] }>(
    role === 'comercio_cliente' ? null : '/collections',
  );
  const { data: batchesData } = useApiData<{ batches: BioplasticBatch[] }>(
    role === 'floricultura' ? null : '/batches',
  );
  const { data: ordersData } = useApiData<{ orders: Order[] }>(
    role === 'floricultura' ? null : '/orders',
  );

  const activities = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = [];

    if (role !== 'comercio_cliente') {
      for (const collection of collectionsData?.collections.slice(0, 5) ?? []) {
        items.push({
          id: `collection-${collection.id}`,
          icon: Flower2,
          title: `${formatKg(collection.weightKg)} de pétalas · ${collection.floristOrganization}`,
          description: `Coleta ${STATUS_META[collection.status]?.label.toLowerCase() ?? ''} · ${collection.floristCity}`,
          date: collection.createdAt,
        });
      }
    }

    if (role !== 'floricultura') {
      for (const batch of batchesData?.batches.slice(0, 5) ?? []) {
        items.push({
          id: `batch-${batch.id}`,
          icon: FlaskConical,
          title: `Lote ${batch.batchCode}`,
          description: `${batch.formulaVersion} · ${formatKg(batch.weightProducedKg)} de bioplástico`,
          date: batch.createdAt,
        });
      }
      for (const order of ordersData?.orders.slice(0, 5) ?? []) {
        items.push({
          id: `order-${order.id}`,
          icon: PackageCheck,
          title: `Pedido de ${formatKg(order.quantityKg)} · ${order.clientOrganization}`,
          description: `${order.batchCode} · ${STATUS_META[order.status]?.label ?? order.status}`,
          date: order.createdAt,
        });
      }
    }

    return items
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6);
  }, [role, collectionsData, batchesData, ordersData]);

  if (!user) return null;

  if (loading && !impactData) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-56 w-full rounded-4xl" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonCard key={index} lines={2} />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
          <Skeleton className="h-80 rounded-3xl" />
          <Skeleton className="h-80 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (error || !impactData) {
    return (
      <div className="space-y-4">
        <Alert tone="error" title="Não foi possível carregar o painel">
          {error ?? 'Tente novamente em instantes.'}
        </Alert>
        <Button onClick={() => void refresh()} icon={<Settings2 className="h-4 w-4" />}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  const impact = impactData.impact;
  const metrics = impact.personal;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  const stats: Array<{
    label: string;
    value: string;
    note: string;
    icon: LucideIcon;
    tone: string;
  }> = [
    {
      label: 'Pétalas desviadas',
      value: formatKg(metrics.petalsDivertedKg),
      note: 'Biomassa floral fora de aterros',
      icon: Flower2,
      tone: 'bg-petal-100 text-petal-700 dark:bg-petal-900/40 dark:text-petal-300',
    },
    {
      label: 'Bioplástico produzido',
      value: formatKg(metrics.bioplasticProducedKg),
      note: 'Produção acumulada e rastreada',
      icon: FlaskConical,
      tone: 'bg-sage-100 text-sage-700 dark:bg-sage-900/40 dark:text-sage-300',
    },
    {
      label: 'Plástico fóssil evitado',
      value: formatKg(metrics.fossilPlasticAvoidedKg),
      note: 'Substituição estimada 1:1 por massa',
      icon: Recycle,
      tone: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
    },
    {
      label: 'Sacolas substituídas',
      value: formatNumber(metrics.bagsEquivalent),
      note: 'Equivalência em sacolas de 5 g',
      icon: ShoppingBag,
      tone: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    },
  ];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-4xl bg-gradient-to-br from-stone-950 via-stone-900 to-sage-950 p-6 text-white shadow-soft sm:p-8">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-petal-500/25 blur-3xl" />
          <div className="absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-sage-500/20 blur-3xl" />
          <div className="absolute inset-0 bg-grid opacity-[0.05]" />
        </div>

        <div className="relative z-10 grid gap-8 lg:grid-cols-[1.35fr_1fr] lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="rose" className="border-white/10 bg-white/10 text-petal-200">
                {scope.label}
              </Badge>
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
                {ROLE_LABELS[role]}
              </span>
            </div>

            <h2 className="mt-4 max-w-2xl font-display text-3xl leading-[1.06] text-white sm:text-4xl">
              {greeting}, {firstName(user.fullName)}.{' '}
              <em className="text-petal-300">{scope.headline}</em>
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/55">
              {scope.description}
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <Link to={quick.to}>
                <Button variant="secondary" size="md" iconRight={<ArrowUpRight className="h-4 w-4" />}>
                  {quick.label}
                </Button>
              </Link>
              <Link to="/app/perfil">
                <Button
                  variant="ghost"
                  className="text-white/70 hover:bg-white/10 hover:text-white"
                  icon={<UserRound className="h-4 w-4" />}
                >
                  Meu perfil
                </Button>
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
                Seu impacto acumulado
              </p>
              <Leaf className="h-4 w-4 text-sage-300" />
            </div>
            <p className="mt-3 font-display text-4xl leading-none text-white">
              {formatDecimal(metrics.petalsDivertedKg)}
              <span className="ml-1.5 text-lg text-white/40">kg</span>
            </p>
            <p className="mt-1 text-xs text-white/45">de pétalas desviadas de aterros</p>

            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
              <div>
                <p className="text-lg font-semibold text-sage-200">
                  {formatKg(metrics.bioplasticProducedKg)}
                </p>
                <p className="text-[10px] text-white/40">bioplástico</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-petal-200">
                  {formatCompact(metrics.co2AvoidedKg)} kg
                </p>
                <p className="text-[10px] text-white/40">CO₂ evitado</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {role === 'superadmin' && impact.counters.pendingUsers > 0 && (
        <Alert tone="warning" title="Contas aguardando aprovação">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>
              {impact.counters.pendingUsers} cadastro
              {impact.counters.pendingUsers > 1 ? 's' : ''} aguardando análise da equipe FIH.
            </span>
            <Link
              to="/app/admin"
              className="inline-flex items-center gap-1 font-semibold underline underline-offset-4"
            >
              Revisar agora <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Alert>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, delay: index * 0.05 }}
          >
            <Card className="group h-full p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-soft">
              <div className="flex items-start justify-between">
                <span className={`grid h-10 w-10 place-items-center rounded-2xl ${stat.tone}`}>
                  <stat.icon className="h-5 w-5" />
                </span>
                <ArrowUpRight className="h-4 w-4 text-muted/40 transition group-hover:text-sage-500" />
              </div>
              <p className="mt-4 font-display text-2xl leading-none text-ink xl:text-[1.7rem]">
                {stat.value}
              </p>
              <p className="mt-1.5 text-xs font-semibold text-ink">{stat.label}</p>
              <p className="mt-2 text-[10px] leading-relaxed text-muted">{stat.note}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
        <Card className="p-5 sm:p-6">
          <CardHeader
            title="Impacto mês a mês"
            description="Pétalas coletadas e bioplástico produzido nos últimos 6 meses."
            icon={<CloudSun className="h-5 w-5" />}
            action={
              <Badge tone="sage" dot>
                Tempo real
              </Badge>
            }
          />
          <ImpactChart monthly={impact.monthly} className="mt-6" />
          <div className="mt-5 grid grid-cols-3 gap-3 border-t border-line/70 pt-4">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted">Coletas</p>
              <p className="mt-1 text-lg font-semibold text-ink">{impact.counters.collections}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted">Lotes</p>
              <p className="mt-1 text-lg font-semibold text-ink">{impact.counters.batches}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted">Pedidos ativos</p>
              <p className="mt-1 text-lg font-semibold text-ink">{impact.counters.orders}</p>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          {role === 'comercio_cliente' && metrics.bioplasticProducedKg > 0 ? (
            <SustainabilitySeal profile={user} impact={metrics} />
          ) : (
            <Card className="p-5">
              <CardHeader
                title="Próximos passos"
                description="Atalhos para manter o ciclo girando."
                icon={<Sparkles className="h-5 w-5" />}
              />
              <div className="mt-4 space-y-2">
                <Link
                  to={quick.to}
                  className="group flex items-center gap-3 rounded-2xl border border-line p-3 transition hover:border-sage-200 hover:bg-sage-50/50 dark:hover:border-sage-800 dark:hover:bg-sage-950/20"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sage-100 text-sage-700 dark:bg-sage-900/40 dark:text-sage-300">
                    <Leaf className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-ink">{quick.label}</span>
                    <span className="block truncate text-[11px] text-muted">
                      {quick.description}
                    </span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-muted transition group-hover:text-sage-500" />
                </Link>

                {role === 'superadmin' && (
                  <Link
                    to="/app/admin"
                    className="group flex items-center gap-3 rounded-2xl border border-line p-3 transition hover:border-sage-200 hover:bg-sage-50/50 dark:hover:border-sage-800 dark:hover:bg-sage-950/20"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-petal-100 text-petal-700 dark:bg-petal-900/40 dark:text-petal-300">
                      <Users className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-ink">Gerenciar contas</span>
                      <span className="block text-[11px] text-muted">
                        {impact.counters.users} usuários cadastrados
                      </span>
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-muted transition group-hover:text-sage-500" />
                  </Link>
                )}

                <Link
                  to="/app/perfil"
                  className="group flex items-center gap-3 rounded-2xl border border-line p-3 transition hover:border-sage-200 hover:bg-sage-50/50 dark:hover:border-sage-800 dark:hover:bg-sage-950/20"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-canvas text-muted">
                    <UserRound className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-ink">Completar meu perfil</span>
                    <span className="block text-[11px] text-muted">
                      Foto, contato e dados da organização
                    </span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-muted transition group-hover:text-sage-500" />
                </Link>
              </div>
            </Card>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <CardHeader
            title="Movimentações recentes"
            description="O que aconteceu por último na cadeia."
            icon={<PackageCheck className="h-5 w-5" />}
          />
          <div className="mt-4 space-y-1">
            {activities.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
                Nenhuma movimentação registrada ainda.
              </p>
            ) : (
              activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 rounded-2xl p-2.5 transition hover:bg-line/20"
                >
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-canvas text-sage-600 dark:text-sage-300">
                    <activity.icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{activity.title}</p>
                    <p className="truncate text-[11px] text-muted">{activity.description}</p>
                  </div>
                  <span className="shrink-0 pt-0.5 text-[10px] text-muted">
                    {timeAgo(activity.date)}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="p-5 sm:p-6">
            <CardHeader
              title="Calculadora de impacto"
              description="Premissas técnicas usadas nos indicadores do MVP."
              icon={<Calculator className="h-5 w-5" />}
            />
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-canvas/70 px-4 py-3">
                <span className="text-xs text-muted">Pétalas de rosa</span>
                <span className="text-xs font-semibold text-ink">1 kg</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-canvas/70 px-4 py-3">
                <span className="text-xs text-muted">Rendimento em bioplástico</span>
                <span className="text-xs font-semibold text-sage-700 dark:text-sage-300">
                  ~0,3 kg
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-canvas/70 px-4 py-3">
                <span className="text-xs text-muted">Plástico fóssil substituído</span>
                <span className="text-xs font-semibold text-ink">1 kg por kg</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-canvas/70 px-4 py-3">
                <span className="text-xs text-muted">Sacola convencional</span>
                <span className="text-xs font-semibold text-ink">5 g</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-canvas/70 px-4 py-3">
                <span className="text-xs text-muted">CO₂ evitado</span>
                <span className="text-xs font-semibold text-ink">3,2 kg por kg</span>
              </div>
            </div>
            <p className="mt-4 text-[10px] leading-relaxed text-muted">
              Estimativas parametrizadas para o MVP e alinhadas às ODS 12, 14 e 15. Os fatores podem
              ser calibrados com laudos do laboratório sem alterar os demais módulos.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 border-t border-line/70 bg-canvas/40 px-5 py-3">
            <Badge tone="sage">ODS 12</Badge>
            <Badge tone="sky">ODS 14</Badge>
            <Badge tone="rose">ODS 15</Badge>
            <Badge tone="zinc">
              <ShieldCheck className="h-3 w-3" />
              Dados rastreáveis
            </Badge>
          </div>
        </Card>
      </div>
    </div>
  );
}
