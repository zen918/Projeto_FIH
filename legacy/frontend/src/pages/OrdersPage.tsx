import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Check,
  CircleSlash,
  ExternalLink,
  PackageCheck,
  PackageOpen,
  Plus,
  Search,
  ShoppingBag,
  Truck,
  XCircle,
} from 'lucide-react';
import { Alert } from '../components/ui/Alert';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { EmptyState } from '../components/ui/Avatar';
import { Field, Input, Select, Textarea } from '../components/ui/Field';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { SkeletonCard } from '../components/ui/Skeleton';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useApiData } from '../hooks/useApiData';
import { api } from '../lib/api';
import { cn } from '../lib/cn';
import { formatDate, formatDecimal, formatKg, timeAgo } from '../lib/format';
import {
  NEXT_ORDER_STATUS,
  ORDER_STATUS_OPTIONS,
  PACKAGING_LABELS,
  QUALITY_LABELS,
} from '../lib/status';
import type {
  BioplasticBatch,
  Order,
  OrderStatus,
  PackagingType,
} from '../types';

interface OrderForm {
  batchId: string;
  quantityKg: string;
  packagingType: PackagingType;
  notes: string;
}

const EMPTY_FORM: OrderForm = {
  batchId: '',
  quantityKg: '',
  packagingType: 'sacola',
  notes: '',
};

const NEXT_ORDER_LABELS: Record<OrderStatus, string> = {
  solicitado: 'Iniciar análise',
  em_analise: 'Aprovar pedido',
  aprovado: 'Iniciar produção',
  em_producao: 'Confirmar entrega',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
};

const NEXT_ORDER_ICONS: Record<OrderStatus, typeof Check> = {
  solicitado: Search,
  em_analise: Check,
  aprovado: PackageOpen,
  em_producao: Truck,
  entregue: Check,
  cancelado: CircleSlash,
};

const STAGES: OrderStatus[] = [
  'solicitado',
  'em_analise',
  'aprovado',
  'em_producao',
  'entregue',
];

export function OrdersPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data, loading, error, refresh } = useApiData<{ orders: Order[] }>('/orders');
  const { data: batchesData } = useApiData<{ batches: BioplasticBatch[] }>('/batches');

  const [filter, setFilter] = useState<'todos' | OrderStatus>('todos');
  const [query, setQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<OrderForm>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);

  const isClient = user?.role === 'comercio_cliente';
  const canManage = user?.role === 'pesquisador_lab' || user?.role === 'superadmin';
  const wantsNew = searchParams.get('new') === '1';

  const orders = data?.orders ?? [];
  const batches = batchesData?.batches ?? [];

  const batchById = useMemo(() => {
    const map = new Map<string, BioplasticBatch>();
    for (const batch of batches) map.set(batch.id, batch);
    return map;
  }, [batches]);

  const availableBatches = useMemo(
    () => batches.filter((batch) => batch.status !== 'arquivado'),
    [batches],
  );

  const reservedByBatch = useMemo(() => {
    const map = new Map<string, number>();
    for (const order of orders) {
      if (order.status === 'cancelado') continue;
      map.set(order.batchId, (map.get(order.batchId) ?? 0) + order.quantityKg);
    }
    return map;
  }, [orders]);

  const selectedBatch = availableBatches.find((batch) => batch.id === form.batchId);
  const selectedBatchReserved = selectedBatch
    ? reservedByBatch.get(selectedBatch.id) ?? 0
    : 0;
  const selectedBatchAvailable = selectedBatch
    ? Math.max(0, selectedBatch.weightProducedKg - selectedBatchReserved)
    : 0;

  const counts = useMemo(() => {
    const result: Record<string, number> = { todos: orders.length };
    for (const order of orders) {
      result[order.status] = (result[order.status] ?? 0) + 1;
    }
    return result;
  }, [orders]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus = filter === 'todos' || order.status === filter;
      const haystack = [
        order.clientOrganization,
        order.clientName,
        order.batchCode,
        order.formulaVersion,
        order.notes,
        PACKAGING_LABELS[order.packagingType],
      ]
        .join(' ')
        .toLowerCase();
      return matchesStatus && (!normalized || haystack.includes(normalized));
    });
  }, [orders, filter, query]);

  useEffect(() => {
    if (!wantsNew || !isClient) return;
    setForm({
      ...EMPTY_FORM,
      batchId: availableBatches[0]?.id ?? '',
    });
    setFormError(null);
    setCreateOpen(true);
    setSearchParams({}, { replace: true });
  }, [wantsNew, isClient, availableBatches, setSearchParams]);

  useEffect(() => {
    if (!createOpen || form.batchId || availableBatches.length === 0) return;
    setForm((current) => ({ ...current, batchId: availableBatches[0].id }));
  }, [createOpen, form.batchId, availableBatches]);

  if (!user) return null;

  const openCreate = () => {
    setForm({
      ...EMPTY_FORM,
      batchId: availableBatches[0]?.id ?? '',
    });
    setFormError(null);
    setCreateOpen(true);
  };

  const canCancel = (order: Order) => {
    if (['entregue', 'cancelado'].includes(order.status)) return false;
    if (isClient) {
      return (
        order.clientId === user.id && ['solicitado', 'em_analise'].includes(order.status)
      );
    }
    return canManage;
  };

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const quantity = Number(form.quantityKg.replace(',', '.'));
    if (!selectedBatch) {
      setFormError('Selecione um lote para o pedido.');
      return;
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setFormError('Informe uma quantidade válida em quilogramas.');
      return;
    }
    if (quantity > selectedBatch.weightProducedKg) {
      setFormError(
        `A produção total deste lote é de ${formatKg(selectedBatch.weightProducedKg)}.`,
      );
      return;
    }

    setSubmitting(true);
    try {
      await api.post<{ order: Order }>('/orders', {
        batchId: selectedBatch.id,
        quantityKg: quantity,
        packagingType: form.packagingType,
        notes: form.notes.trim(),
      });
      toast.success(
        'Seu pedido entrou na fila de análise. A equipe do laboratório vai confirmar a disponibilidade.',
        'Pedido solicitado',
      );
      setCreateOpen(false);
      setForm(EMPTY_FORM);
      await refresh();
    } catch (submitError) {
      setFormError(
        submitError instanceof Error
          ? submitError.message
          : 'Não foi possível registrar o pedido.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (order: Order, status: OrderStatus) => {
    setActionId(order.id);
    try {
      await api.patch<{ order: Order }>(`/orders/${order.id}`, { status });
      toast.success(
        status === 'cancelado'
          ? 'Pedido cancelado e volume liberado no lote.'
          : `Pedido atualizado para ${NEXT_ORDER_LABELS[status].toLowerCase()}.`,
        'Pedido atualizado',
      );
      setCancelTarget(null);
      await refresh();
    } catch (actionError) {
      toast.error(
        actionError instanceof Error
          ? actionError.message
          : 'Não foi possível atualizar o pedido.',
      );
    } finally {
      setActionId(null);
    }
  };

  const totalActive = orders.filter(
    (order) => !['entregue', 'cancelado'].includes(order.status),
  ).length;
  const totalProducing = orders.filter((order) => order.status === 'em_producao').length;
  const totalDelivered = orders.filter((order) => order.status === 'entregue').length;
  const contractedKg = orders
    .filter((order) => order.status !== 'cancelado')
    .reduce((total, order) => total + order.quantityKg, 0);

  const stats = [
    {
      label: 'Pedidos ativos',
      value: String(totalActive),
      note: 'Aguardando análise, produção ou entrega',
      icon: PackageCheck,
      tone: 'bg-sage-100 text-sage-700 dark:bg-sage-900/40 dark:text-sage-300',
    },
    {
      label: 'Em produção',
      value: String(totalProducing),
      note: 'Bioplástico sendo preparado',
      icon: Truck,
      tone: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    },
    {
      label: 'Entregues',
      value: String(totalDelivered),
      note: 'Ciclos concluídos com rastreabilidade',
      icon: Check,
      tone: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
    },
    {
      label: 'Volume contratado',
      value: formatKg(contractedKg),
      note: 'Soma dos pedidos não cancelados',
      icon: ShoppingBag,
      tone: 'bg-petal-100 text-petal-700 dark:bg-petal-900/40 dark:text-petal-300',
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow={isClient ? 'Relações comerciais B2B' : 'Gestão de pedidos'}
        title="Pedidos B2B"
        description={
          isClient
            ? 'Solicite bioplástico a partir de lotes rastreados, acompanhe a produção e comprove o impacto no seu selo de sustentabilidade.'
            : 'Analise solicitações, avance o status de produção e entregue bioplástico com a origem das pétalas documentada.'
        }
        action={
          isClient ? (
            <Button onClick={openCreate} icon={<Plus className="h-4 w-4" />}>
              Novo pedido
            </Button>
          ) : undefined
        }
      />

      {isClient && (
        <Alert tone="info" className="mb-5" title="Estoque vivo entre parceiros">
          A disponibilidade de cada lote é compartilhada entre todos os comércios. O sistema valida
          o volume no envio e libera automaticamente a quantidade de pedidos cancelados.
        </Alert>
      )}

      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                {stat.label}
              </span>
              <span className={`grid h-7 w-7 place-items-center rounded-xl ${stat.tone}`}>
                <stat.icon className="h-3.5 w-3.5" />
              </span>
            </div>
            <p className="mt-1.5 font-display text-2xl leading-none text-ink">{stat.value}</p>
            <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-muted">{stat.note}</p>
          </Card>
        ))}
      </div>

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setFilter('todos')}
            className={cn(
              'focus-ring shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition',
              filter === 'todos'
                ? 'border-sage-600 bg-sage-600 text-white'
                : 'border-line bg-surface text-muted hover:text-ink',
            )}
          >
            Todos ({counts.todos ?? 0})
          </button>
          {ORDER_STATUS_OPTIONS.map((status) => (
            <button
              key={status.value}
              type="button"
              onClick={() => setFilter(status.value)}
              className={cn(
                'focus-ring shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition',
                filter === status.value
                  ? 'border-sage-600 bg-sage-600 text-white'
                  : 'border-line bg-surface text-muted hover:text-ink',
              )}
            >
              {status.label} ({counts[status.value] ?? 0})
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar cliente, lote, formato…"
            className="pl-10"
            aria-label="Buscar pedidos"
          />
        </div>
      </div>

      {error && (
        <Alert tone="error" className="mb-4" title="Não foi possível carregar os pedidos">
          {error}
        </Alert>
      )}

      {loading && orders.length === 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} lines={4} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={PackageCheck}
          title={orders.length === 0 ? 'Nenhum pedido por aqui' : 'Nenhum pedido encontrado'}
          description={
            orders.length === 0
              ? isClient
                ? 'Escolha um lote no catálogo e solicite a primeira amostra de bioplástico rastreado.'
                : 'Assim que um comércio solicitar bioplástico, o pedido aparecerá nesta fila.'
              : 'Ajuste os filtros ou a busca para encontrar outros pedidos.'
          }
          action={
            isClient && orders.length === 0 ? (
              <Button onClick={openCreate} icon={<Plus className="h-4 w-4" />}>
                Fazer primeiro pedido
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((order, index) => {
            const nextStatus = NEXT_ORDER_STATUS[order.status];
            const NextIcon = nextStatus ? NEXT_ORDER_ICONS[nextStatus] : Check;
            const batch = batchById.get(order.batchId);
            const stageIndex = STAGES.indexOf(order.status);
            const busy = actionId === order.id;
            const cancellable = canCancel(order);

            return (
              <motion.article
                key={order.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.26, delay: Math.min(index * 0.03, 0.2) }}
                className="surface-card flex flex-col p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sage-100 text-sage-700 dark:bg-sage-900/40 dark:text-sage-300">
                      <PackageCheck className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted">
                        {order.batchCode}
                      </p>
                      <h3 className="mt-1 truncate text-sm font-semibold text-ink">
                        {order.formulaVersion}
                      </h3>
                      <p className="truncate text-[11px] text-muted">
                        {order.clientOrganization}
                        {canManage ? ` · ${order.clientName}` : ''}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                <div className="mt-4 flex items-end justify-between gap-3">
                  <div className="flex items-end gap-2">
                    <p className="font-display text-3xl leading-none text-ink">
                      {formatDecimal(order.quantityKg)}
                    </p>
                    <span className="pb-0.5 text-xs text-muted">kg solicitados</span>
                  </div>
                  <Badge tone="zinc">{PACKAGING_LABELS[order.packagingType]}</Badge>
                </div>

                {order.status !== 'cancelado' && stageIndex >= 0 && (
                  <div className="mt-4 flex gap-1">
                    {STAGES.map((stage, stageItemIndex) => (
                      <span
                        key={stage}
                        className={cn(
                          'h-1 flex-1 rounded-full',
                          stageItemIndex <= stageIndex ? 'bg-sage-500/70' : 'bg-line',
                        )}
                      />
                    ))}
                  </div>
                )}

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-2xl bg-canvas/70 p-3">
                    <PackageOpen className="h-4 w-4 text-sage-600 dark:text-sage-300" />
                    <p className="mt-1.5 text-[11px] font-semibold text-ink">
                      {PACKAGING_LABELS[order.packagingType]}
                    </p>
                    <p className="text-[9px] uppercase tracking-wide text-muted">formato</p>
                  </div>
                  <div className="rounded-2xl bg-canvas/70 p-3">
                    <Truck className="h-4 w-4 text-petal-600 dark:text-petal-300" />
                    <p className="mt-1.5 text-[11px] font-semibold text-ink">
                      {formatDate(order.updatedAt)}
                    </p>
                    <p className="text-[9px] uppercase tracking-wide text-muted">última etapa</p>
                  </div>
                </div>

                {order.notes && (
                  <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted">
                    {order.notes}
                  </p>
                )}

                <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-line/70 pt-3">
                  <span className="text-[10px] text-muted">
                    Solicitado {timeAgo(order.createdAt)}
                  </span>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {batch && (
                      <a
                        href={`/r/${batch.traceCode}`}
                        target="_blank"
                        rel="noreferrer"
                        className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-3.5 text-xs font-semibold text-ink transition hover:border-sage-300 hover:bg-sage-50 dark:hover:border-sage-700 dark:hover:bg-sage-900/20"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Rastreio
                      </a>
                    )}

                    {canManage && nextStatus && (
                      <Button
                        size="sm"
                        onClick={() => void updateStatus(order, nextStatus)}
                        loading={busy}
                        icon={<NextIcon className="h-3.5 w-3.5" />}
                      >
                        {NEXT_ORDER_LABELS[nextStatus]}
                      </Button>
                    )}

                    {cancellable && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setCancelTarget(order)}
                        disabled={busy}
                        icon={<XCircle className="h-3.5 w-3.5" />}
                      >
                        Cancelar
                      </Button>
                    )}

                    {!nextStatus && order.status === 'entregue' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-sage-700 dark:text-sage-300">
                        <Check className="h-3.5 w-3.5" />
                        Ciclo concluído
                      </span>
                    )}
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Solicitar bioplástico"
        description="Escolha o lote rastreado e informe o volume desejado para o seu negócio."
        eyebrow="Novo pedido B2B"
        icon={<PackageCheck className="h-5 w-5" />}
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="order-form"
              loading={submitting}
              disabled={availableBatches.length === 0}
            >
              Enviar pedido
            </Button>
          </div>
        }
      >
        <form id="order-form" onSubmit={handleCreate} className="space-y-4">
          {availableBatches.length === 0 ? (
            <Alert tone="warning" title="Nenhum lote disponível">
              Todos os lotes estão arquivados no momento. Assim que o laboratório concluir uma nova
              produção, o catálogo será atualizado.{' '}
              <Link to="/app/lotes" className="font-semibold underline underline-offset-2">
                Ver catálogo
              </Link>
            </Alert>
          ) : (
            <Field label="Lote de bioplástico" htmlFor="order-batch" required>
              <Select
                id="order-batch"
                value={form.batchId}
                onChange={(event) => setForm({ ...form, batchId: event.target.value })}
                required
              >
                <option value="">Selecione um lote</option>
                {availableBatches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.batchCode} · {batch.formulaVersion} ·{' '}
                    {formatKg(batch.weightProducedKg)}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          {selectedBatch && (
            <div className="rounded-2xl border border-line bg-canvas/60 p-3.5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted">
                    {selectedBatch.batchCode}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-ink">
                    {selectedBatch.formulaVersion}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {selectedBatch.origin?.floristOrganization ?? 'Origem não vinculada'}
                    {selectedBatch.origin
                      ? ` · ${selectedBatch.origin.floristCity} · pétalas com ${QUALITY_LABELS[
                          selectedBatch.origin.qualityStatus
                        ].toLowerCase()}`
                      : ''}
                  </p>
                </div>
                <StatusBadge status={selectedBatch.status} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line/70 pt-3">
                <div>
                  <p className="text-[9px] uppercase tracking-wide text-muted">produção do lote</p>
                  <p className="mt-0.5 text-sm font-semibold text-ink">
                    {formatKg(selectedBatch.weightProducedKg)}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wide text-muted">
                    {isClient ? 'seu volume reservado' : 'reservado por pedidos'}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-ink">
                    {formatKg(selectedBatchReserved)}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-muted">
                {isClient
                  ? 'A disponibilidade final é validada no envio, considerando as reservas de todos os comércios. Se restar menos que o solicitado, ajuste a quantidade.'
                  : `Saldo estimado: ${formatKg(selectedBatchAvailable)}.`}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Quantidade desejada (kg)" htmlFor="order-quantity" required>
              <Input
                id="order-quantity"
                inputMode="decimal"
                placeholder="Ex.: 1,5"
                value={form.quantityKg}
                onChange={(event) => setForm({ ...form, quantityKg: event.target.value })}
                required
              />
            </Field>
            <Field label="Formato da embalagem" htmlFor="order-packaging" required>
              <Select
                id="order-packaging"
                value={form.packagingType}
                onChange={(event) =>
                  setForm({ ...form, packagingType: event.target.value as PackagingType })
                }
              >
                {Object.entries(PACKAGING_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field
            label="Observações do pedido"
            htmlFor="order-notes"
            hint="Opcional. Aplicação, prazo desejado, cor ou espessura."
          >
            <Textarea
              id="order-notes"
              placeholder="Conte como o bioplástico será usado no seu comércio…"
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
            />
          </Field>

          {formError && <Alert tone="error">{formError}</Alert>}

          <Alert tone="info">
            O pedido entra como <strong>solicitado</strong>. O laboratório analisa a disponibilidade,
            aprova, produz e confirma a entrega. Cada lote mantém o QR Code público de rastreio.
          </Alert>
        </form>
      </Modal>

      <ConfirmModal
        open={Boolean(cancelTarget)}
        title="Cancelar este pedido?"
        description={
          cancelTarget
            ? `O pedido de ${formatKg(cancelTarget.quantityKg)} do lote ${cancelTarget.batchCode} será cancelado e o volume voltará a ficar disponível para outros comércios.`
            : ''
        }
        confirmLabel="Sim, cancelar pedido"
        loading={actionId === cancelTarget?.id}
        onCancel={() => setCancelTarget(null)}
        onConfirm={() => {
          if (cancelTarget) void updateStatus(cancelTarget, 'cancelado');
        }}
      />
    </div>
  );
}
