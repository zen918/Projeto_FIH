import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CalendarClock,
  Check,
  Flower2,
  MapPin,
  Plus,
  Search,
  Truck,
  XCircle,
} from 'lucide-react';
import { Alert } from '../components/ui/Alert';
import { StatusBadge } from '../components/ui/Badge';
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
import { formatDate, formatKg, inputDateOffset, timeAgo } from '../lib/format';
import {
  COLLECTION_STATUS_OPTIONS,
  NEXT_COLLECTION_STATUS,
  QUALITY_LABELS,
} from '../lib/status';
import type { CollectionStatus, PetalCollection, QualityStatus } from '../types';

interface CollectionForm {
  weightKg: string;
  qualityStatus: QualityStatus;
  pickupDate: string;
  address: string;
  notes: string;
}

function emptyForm(): CollectionForm {
  return {
    weightKg: '',
    qualityStatus: 'boa',
    pickupDate: inputDateOffset(3),
    address: '',
    notes: '',
  };
}

const NEXT_LABELS: Record<string, string> = {
  agendada: 'Agendar coleta',
  coletada: 'Confirmar coleta',
  processada: 'Enviar ao laboratório',
};

const STAGES: CollectionStatus[] = ['solicitada', 'agendada', 'coletada', 'processada'];

export function CollectionsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data, loading, error, refresh } = useApiData<{ collections: PetalCollection[] }>(
    '/collections',
  );

  const [filter, setFilter] = useState<'todos' | CollectionStatus>('todos');
  const [query, setQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<CollectionForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<PetalCollection | null>(null);

  const wantsNew = searchParams.get('new') === '1';

  useEffect(() => {
    if (!wantsNew) return;
    setForm(emptyForm());
    setFormError(null);
    setCreateOpen(true);
    setSearchParams({}, { replace: true });
  }, [wantsNew, setSearchParams]);

  const collections = data?.collections ?? [];

  const counts = useMemo(() => {
    const result: Record<string, number> = { todos: collections.length };
    for (const collection of collections) {
      result[collection.status] = (result[collection.status] ?? 0) + 1;
    }
    return result;
  }, [collections]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return collections.filter((collection) => {
      const matchesStatus = filter === 'todos' || collection.status === filter;
      const haystack =
        `${collection.floristOrganization} ${collection.floristName} ${collection.floristCity} ${collection.notes} ${collection.address}`.toLowerCase();
      return matchesStatus && (!normalized || haystack.includes(normalized));
    });
  }, [collections, filter, query]);

  if (!user) return null;

  const isFlorist = user.role === 'floricultura';
  const canManage = user.role === 'pesquisador_lab' || user.role === 'superadmin';

  const canCancel = (collection: PetalCollection) =>
    ['solicitada', 'agendada'].includes(collection.status) &&
    (canManage || (isFlorist && collection.floristId === user.id));

  const openCreate = () => {
    setForm(emptyForm());
    setFormError(null);
    setCreateOpen(true);
  };

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const weight = Number(form.weightKg.replace(',', '.'));
    if (!Number.isFinite(weight) || weight <= 0) {
      setFormError('Informe um peso válido em quilogramas.');
      return;
    }
    if (form.address.trim().length < 3) {
      setFormError('Informe o endereço de retirada.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/collections', {
        weightKg: weight,
        qualityStatus: form.qualityStatus,
        pickupDate: form.pickupDate,
        address: form.address.trim(),
        notes: form.notes.trim(),
      });
      toast.success('Disponibilidade registrada. O laboratório já pode agendar a coleta.', 'Coleta criada');
      setCreateOpen(false);
      setForm(emptyForm());
      await refresh();
    } catch (submitError) {
      setFormError(
        submitError instanceof Error ? submitError.message : 'Não foi possível registrar a coleta.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (collection: PetalCollection, status: CollectionStatus) => {
    setActionId(collection.id);
    try {
      await api.patch(`/collections/${collection.id}`, { status });
      toast.success(
        status === 'cancelada'
          ? 'Coleta cancelada.'
          : `Coleta atualizada para ${status}.`,
        'Tudo certo',
      );
      setCancelTarget(null);
      await refresh();
    } catch (actionError) {
      toast.error(
        actionError instanceof Error ? actionError.message : 'Não foi possível atualizar a coleta.',
      );
    } finally {
      setActionId(null);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Logística reversa"
        title="Coletas de pétalas"
        description={
          isFlorist
            ? 'Registre picos de descarte e acompanhe a retirada das pétalas da sua floricultura antes que percam qualidade.'
            : 'Acompanhe a disponibilidade de biomassa floral, agende retiradas e encaminhe as pétalas ao laboratório.'
        }
        action={
          isFlorist ? (
            <Button onClick={openCreate} icon={<Plus className="h-4 w-4" />}>
              Nova coleta
            </Button>
          ) : undefined
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { status: 'solicitada', label: 'Aguardando', icon: CalendarClock },
          { status: 'agendada', label: 'Agendadas', icon: Truck },
          { status: 'coletada', label: 'Coletadas', icon: Check },
          { status: 'processada', label: 'Processadas', icon: Flower2 },
        ].map((item) => (
          <Card key={item.status} className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                {item.label}
              </span>
              <item.icon className="h-3.5 w-3.5 text-muted/60" />
            </div>
            <p className="mt-1.5 font-display text-2xl leading-none text-ink">
              {counts[item.status] ?? 0}
            </p>
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
            Todas ({counts.todos ?? 0})
          </button>
          {COLLECTION_STATUS_OPTIONS.map((status) => (
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
            placeholder="Buscar floricultura, cidade…"
            className="pl-10"
            aria-label="Buscar coletas"
          />
        </div>
      </div>

      {error && (
        <Alert tone="error" className="mb-4" title="Não foi possível carregar as coletas">
          {error}
        </Alert>
      )}

      {loading && collections.length === 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} lines={3} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Flower2}
          title={collections.length === 0 ? 'Nenhuma coleta registrada' : 'Nada por aqui'}
          description={
            collections.length === 0
              ? isFlorist
                ? 'Registre a primeira disponibilidade de pétalas e dê início ao ciclo.'
                : 'Assim que uma floricultura registrar pétalas, elas aparecerão aqui.'
              : 'Ajuste os filtros ou a busca para encontrar outras coletas.'
          }
          action={
            isFlorist && collections.length === 0 ? (
              <Button onClick={openCreate} icon={<Plus className="h-4 w-4" />}>
                Registrar pétalas
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((collection, index) => {
            const nextStatus = NEXT_COLLECTION_STATUS[collection.status];
            const stageIndex = STAGES.indexOf(collection.status);
            const busy = actionId === collection.id;

            return (
              <motion.article
                key={collection.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.26, delay: Math.min(index * 0.03, 0.2) }}
                className="surface-card flex flex-col p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-petal-100 text-petal-700 dark:bg-petal-900/40 dark:text-petal-300">
                      <Flower2 className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-ink">
                        {collection.floristOrganization}
                      </h3>
                      <p className="truncate text-[11px] text-muted">
                        {collection.floristName} · {collection.floristCity}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={collection.status} />
                </div>

                <div className="mt-4 grid grid-cols-3 divide-x divide-line/70 rounded-2xl bg-canvas/70 py-3">
                  <div className="px-2 text-center">
                    <p className="text-sm font-bold text-ink">{formatKg(collection.weightKg)}</p>
                    <p className="mt-0.5 text-[9px] uppercase tracking-wide text-muted">pétalas</p>
                  </div>
                  <div className="px-2 text-center">
                    <p className="text-sm font-bold text-ink">
                      {QUALITY_LABELS[collection.qualityStatus]}
                    </p>
                    <p className="mt-0.5 text-[9px] uppercase tracking-wide text-muted">qualidade</p>
                  </div>
                  <div className="px-2 text-center">
                    <p className="text-sm font-bold text-ink">{formatDate(collection.pickupDate)}</p>
                    <p className="mt-0.5 text-[9px] uppercase tracking-wide text-muted">coleta até</p>
                  </div>
                </div>

                {collection.status !== 'cancelada' && stageIndex >= 0 && (
                  <div className="mt-3 flex gap-1">
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

                {collection.notes && (
                  <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted">
                    {collection.notes}
                  </p>
                )}

                <div className="mt-3 flex items-start gap-1.5 text-[11px] text-muted">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span className="line-clamp-1">{collection.address}</span>
                </div>

                <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-line/70 pt-3">
                  <span className="text-[10px] text-muted">Criada {timeAgo(collection.createdAt)}</span>

                  <div className="flex items-center gap-1.5">
                    {canManage && nextStatus && (
                      <Button
                        size="sm"
                        onClick={() => void updateStatus(collection, nextStatus)}
                        loading={busy}
                        icon={nextStatus === 'agendada' ? <CalendarClock className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                      >
                        {NEXT_LABELS[nextStatus] ?? nextStatus}
                      </Button>
                    )}
                    {canCancel(collection) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setCancelTarget(collection)}
                        disabled={busy}
                        icon={<XCircle className="h-3.5 w-3.5" />}
                      >
                        Cancelar
                      </Button>
                    )}
                    {!canManage && !canCancel(collection) && collection.status !== 'cancelada' && (
                      <span className="text-[10px] font-medium text-muted">
                        {collection.status === 'coletada' ? 'No laboratório' : 'Ciclo concluído'}
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
        title="Registrar disponibilidade de pétalas"
        description="Informe o volume e o prazo para retirada antes da perda de qualidade."
        eyebrow="Nova coleta"
        icon={<Flower2 className="h-5 w-5" />}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" form="collection-form" loading={submitting}>
              Registrar coleta
            </Button>
          </div>
        }
      >
        <form id="collection-form" onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Peso das pétalas (kg)" htmlFor="collection-weight" required>
              <Input
                id="collection-weight"
                inputMode="decimal"
                placeholder="Ex.: 12,5"
                value={form.weightKg}
                onChange={(event) => setForm({ ...form, weightKg: event.target.value })}
                required
              />
            </Field>
            <Field label="Estado de conservação" htmlFor="collection-quality" required>
              <Select
                id="collection-quality"
                value={form.qualityStatus}
                onChange={(event) =>
                  setForm({ ...form, qualityStatus: event.target.value as QualityStatus })
                }
              >
                {Object.entries(QUALITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field
            label="Data limite para coleta"
            htmlFor="collection-date"
            hint="O laboratório usa essa data para priorizar a rota."
            required
          >
            <Input
              id="collection-date"
              type="date"
              min={inputDateOffset(0)}
              value={form.pickupDate}
              onChange={(event) => setForm({ ...form, pickupDate: event.target.value })}
              required
            />
          </Field>

          <Field label="Endereço de retirada" htmlFor="collection-address" required>
            <Input
              id="collection-address"
              placeholder="Rua, número, bairro · Cidade/UF"
              value={form.address}
              onChange={(event) => setForm({ ...form, address: event.target.value })}
              required
            />
          </Field>

          <Field label="Observações" htmlFor="collection-notes" hint="Opcional. Ex.: pico pós-evento.">
            <Textarea
              id="collection-notes"
              placeholder="Conte o contexto do descarte: tipo de rosa, evento, armazenamento…"
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
            />
          </Field>

          {formError && <Alert tone="error">{formError}</Alert>}

          <Alert tone="info">
            Após o registro, a equipe do laboratório poderá agendar e confirmar a retirada. A
            floricultura pode cancelar enquanto a coleta não for realizada.
          </Alert>
        </form>
      </Modal>

      <ConfirmModal
        open={Boolean(cancelTarget)}
        title="Cancelar esta coleta?"
        description={
          cancelTarget
            ? `A coleta de ${formatKg(cancelTarget.weightKg)} de ${cancelTarget.floristOrganization} será marcada como cancelada e sairá da fila do laboratório.`
            : ''
        }
        confirmLabel="Sim, cancelar coleta"
        loading={actionId === cancelTarget?.id}
        onCancel={() => setCancelTarget(null)}
        onConfirm={() => {
          if (cancelTarget) void updateStatus(cancelTarget, 'cancelada');
        }}
      />
    </div>
  );
}
