import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Archive,
  Beaker,
  ExternalLink,
  FlaskConical,
  Gauge,
  ImageIcon,
  Leaf,
  Loader2,
  Plus,
  QrCode,
  Search,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { Alert } from '../components/ui/Alert';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/Avatar';
import { Field, Input, Select, Textarea } from '../components/ui/Field';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { SkeletonCard } from '../components/ui/Skeleton';
import { QrModal } from '../components/QrModal';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useApiData } from '../hooks/useApiData';
import { api } from '../lib/api';
import { cn } from '../lib/cn';
import { formatDate, formatDecimal, formatKg } from '../lib/format';
import { NEXT_BATCH_STATUS, QUALITY_LABELS } from '../lib/status';
import type { BioplasticBatch, PetalCollection } from '../types';

interface BatchForm {
  collectionId: string;
  formulaVersion: string;
  weightProducedKg: string;
  biodegradationDays: string;
  tensileStrength: string;
  notes: string;
}

const EMPTY_FORM: BatchForm = {
  collectionId: '',
  formulaVersion: '',
  weightProducedKg: '',
  biodegradationDays: '',
  tensileStrength: '',
  notes: '',
};

const NEXT_BATCH_LABELS: Record<string, string> = {
  concluido: 'Marcar concluído',
  arquivado: 'Arquivar lote',
};

export function BatchesPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const canManage = user?.role === 'pesquisador_lab' || user?.role === 'superadmin';
  const isClient = user?.role === 'comercio_cliente';

  const { data, loading, error, refresh } = useApiData<{ batches: BioplasticBatch[] }>('/batches');
  const { data: collectionsData } = useApiData<{ collections: PetalCollection[] }>(
    canManage ? '/collections' : null,
  );

  const [query, setQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<BatchForm>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [qrBatch, setQrBatch] = useState<BioplasticBatch | null>(null);
  const [evidenceId, setEvidenceId] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const wantsNew = searchParams.get('new') === '1';

  const batches = data?.batches ?? [];
  const collections = collectionsData?.collections ?? [];
  const availableCollections = useMemo(
    () => collections.filter((collection) => ['coletada', 'processada'].includes(collection.status)),
    [collections],
  );

  const selectedCollection = availableCollections.find(
    (collection) => collection.id === form.collectionId,
  );

  useEffect(() => {
    if (!wantsNew) return;
    setForm(EMPTY_FORM);
    setFormError(null);
    setCreateOpen(true);
    setSearchParams({}, { replace: true });
  }, [wantsNew, setSearchParams]);

  useEffect(() => {
    if (!createOpen || form.collectionId || availableCollections.length === 0) return;
    setForm((current) => ({ ...current, collectionId: availableCollections[0].id }));
  }, [createOpen, form.collectionId, availableCollections]);

  if (!user) return null;

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return batches;
    return batches.filter((batch) =>
      [
        batch.batchCode,
        batch.formulaVersion,
        batch.traceCode,
        batch.origin?.floristOrganization ?? '',
        batch.researcherName,
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalized),
    );
  }, [batches, query]);

  const openCreate = () => {
    setForm({
      ...EMPTY_FORM,
      collectionId: availableCollections[0]?.id ?? '',
    });
    setFormError(null);
    setCreateOpen(true);
  };

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (!form.collectionId) {
      setFormError('Selecione uma coleta de pétalas para originar o lote.');
      return;
    }

    setSubmitting(true);
    try {
      const { batch } = await api.post<{ batch: BioplasticBatch }>('/batches', {
        collectionId: form.collectionId,
        formulaVersion: form.formulaVersion.trim(),
        weightProducedKg: Number(form.weightProducedKg.replace(',', '.')),
        biodegradationDays: Number(form.biodegradationDays),
        tensileStrength: Number(form.tensileStrength.replace(',', '.')),
        notes: form.notes.trim(),
      });
      toast.success('Lote registrado com QR Code de rastreabilidade.', 'Bioplástico produzido');
      setCreateOpen(false);
      setForm(EMPTY_FORM);
      setQrBatch(batch);
      await refresh();
    } catch (submitError) {
      setFormError(
        submitError instanceof Error ? submitError.message : 'Não foi possível registrar o lote.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const advanceStatus = async (batch: BioplasticBatch) => {
    const next = NEXT_BATCH_STATUS[batch.status];
    if (!next) return;
    setActionId(batch.id);
    try {
      await api.patch(`/batches/${batch.id}`, { status: next });
      toast.success(`Lote atualizado para ${next === 'concluido' ? 'concluído' : 'arquivado'}.`);
      await refresh();
    } catch (actionError) {
      toast.error(
        actionError instanceof Error ? actionError.message : 'Não foi possível atualizar o lote.',
      );
    } finally {
      setActionId(null);
    }
  };

  const uploadEvidence = async (batchId: string, file: File | null) => {
    if (!file) return;
    setEvidenceId(batchId);
    const formData = new FormData();
    formData.append('file', file);
    try {
      await api.upload(`/batches/${batchId}/evidence`, formData);
      toast.success('Evidência de qualidade anexada ao lote.');
      await refresh();
    } catch (uploadError) {
      toast.error(
        uploadError instanceof Error
          ? uploadError.message
          : 'Não foi possível anexar a evidência.',
      );
    } finally {
      setEvidenceId(null);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow={isClient ? 'Catálogo B2B' : 'Produção e qualidade'}
        title={isClient ? 'Catálogo de bioplástico' : 'Lotes de bioplástico'}
        description={
          isClient
            ? 'Conheça as formulações disponíveis, confira a origem das pétalas e solicite amostras com rastreabilidade completa.'
            : 'Registre formulações e evidências de qualidade. Cada lote recebe um QR Code público para a jornada “da pétala à embalagem”.'
        }
        action={
          canManage ? (
            <Button onClick={openCreate} icon={<Plus className="h-4 w-4" />}>
              Novo lote
            </Button>
          ) : undefined
        }
      />

      {isClient && (
        <Alert tone="info" className="mb-5" title="Rastreabilidade que vira argumento de venda">
          Cada lote tem QR Code com origem das pétalas, tempo de biodegradação e impacto evitado.
          Use o selo digital no seu comércio e comprove a escolha sustentável aos seus clientes.{' '}
          <Link to="/app/pedidos?new=1" className="font-semibold underline underline-offset-2">
            Fazer um pedido
          </Link>
        </Alert>
      )}

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          <Badge tone="sage" dot>
            {batches.filter((batch) => batch.status === 'concluido').length} concluídos
          </Badge>
          <Badge tone="amber" dot>
            {batches.filter((batch) => batch.status === 'em_producao').length} em produção
          </Badge>
          <Badge tone="zinc" dot>
            {batches.length} lotes no total
          </Badge>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar lote, fórmula, origem…"
            className="pl-10"
            aria-label="Buscar lotes"
          />
        </div>
      </div>

      {error && (
        <Alert tone="error" className="mb-4" title="Não foi possível carregar os lotes">
          {error}
        </Alert>
      )}

      {loading && batches.length === 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} lines={4} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FlaskConical}
          title={batches.length === 0 ? 'Nenhum lote registrado' : 'Nenhum lote encontrado'}
          description={
            batches.length === 0
              ? canManage
                ? 'Finalize uma coleta e registre o primeiro lote de bioplástico com QR Code.'
                : 'Assim que o laboratório registrar um lote, ele aparecerá neste catálogo.'
              : 'Ajuste a busca para encontrar outro lote.'
          }
          action={
            canManage && batches.length === 0 ? (
              <Button onClick={openCreate} icon={<Plus className="h-4 w-4" />}>
                Registrar lote
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((batch, index) => {
            const nextStatus = NEXT_BATCH_STATUS[batch.status];
            return (
              <motion.article
                key={batch.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.26, delay: Math.min(index * 0.03, 0.2) }}
                className="surface-card flex flex-col p-5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted">
                      {batch.batchCode}
                    </p>
                    <h3 className="mt-1.5 line-clamp-1 font-display text-xl leading-tight text-ink">
                      {batch.formulaVersion}
                    </h3>
                    <p className="mt-0.5 truncate text-[11px] text-muted">
                      {batch.researcherOrganization}
                    </p>
                  </div>
                  <StatusBadge status={batch.status} />
                </div>

                <div className="mt-4 flex items-end gap-2">
                  <p className="font-display text-3xl leading-none text-ink">
                    {formatDecimal(batch.weightProducedKg)}
                  </p>
                  <span className="pb-0.5 text-xs text-muted">kg de bioplástico</span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-2xl bg-canvas/70 p-3">
                    <Leaf className="h-4 w-4 text-sage-600 dark:text-sage-300" />
                    <p className="mt-1.5 text-sm font-bold text-ink">
                      {batch.biodegradationDays} dias
                    </p>
                    <p className="text-[9px] uppercase tracking-wide text-muted">em solo</p>
                  </div>
                  <div className="rounded-2xl bg-canvas/70 p-3">
                    <Gauge className="h-4 w-4 text-petal-600 dark:text-petal-300" />
                    <p className="mt-1.5 text-sm font-bold text-ink">
                      {formatDecimal(batch.tensileStrength)} MPa
                    </p>
                    <p className="text-[9px] uppercase tracking-wide text-muted">tração</p>
                  </div>
                </div>

                <div className="mt-3 rounded-2xl border border-line p-3">
                  <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted">
                    Origem das pétalas
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold text-ink">
                    {batch.origin?.floristOrganization ?? 'Origem não vinculada'}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {batch.origin?.floristCity ?? '—'} ·{' '}
                    {batch.origin ? formatKg(batch.origin.petalWeightKg) : '—'} de pétalas
                    {batch.origin ? ` · ${QUALITY_LABELS[batch.origin.qualityStatus]}` : ''}
                  </p>
                  {batch.origin && (
                    <p className="mt-1 text-[10px] text-muted">
                      Coleta até {formatDate(batch.origin.pickupDate)}
                    </p>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between gap-2 rounded-2xl bg-sage-50/70 px-3 py-2 text-[11px] text-sage-800 dark:bg-sage-950/30 dark:text-sage-200">
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Rastreio {batch.traceCode}
                  </span>
                  {batch.evidenceUrl && (
                    <a
                      href={batch.evidenceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-semibold underline-offset-2 hover:underline"
                    >
                      <ImageIcon className="h-3.5 w-3.5" />
                      Evidência
                    </a>
                  )}
                </div>

                <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-line/70 pt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setQrBatch(batch)}
                    icon={<QrCode className="h-3.5 w-3.5" />}
                  >
                    QR Code
                  </Button>

                  <a
                    href={`/r/${batch.traceCode}`}
                    target="_blank"
                    rel="noreferrer"
                    className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-3.5 text-xs font-semibold text-ink transition hover:border-sage-300 hover:bg-sage-50 dark:hover:border-sage-700 dark:hover:bg-sage-900/20"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Rastreio
                  </a>

                  {canManage && (
                    <>
                      <label
                        className={cn(
                          'focus-ring inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-line px-3.5 text-xs font-semibold text-ink transition hover:border-sage-300 hover:bg-sage-50 dark:hover:border-sage-700 dark:hover:bg-sage-900/20',
                          evidenceId === batch.id && 'pointer-events-none opacity-60',
                        )}
                      >
                        {evidenceId === batch.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Upload className="h-3.5 w-3.5" />
                        )}
                        Evidência
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="sr-only"
                          onChange={(event) => {
                            void uploadEvidence(batch.id, event.target.files?.[0] ?? null);
                            event.target.value = '';
                          }}
                        />
                      </label>

                      {nextStatus && (
                        <Button
                          size="sm"
                          onClick={() => void advanceStatus(batch)}
                          loading={actionId === batch.id}
                          icon={nextStatus === 'arquivado' ? <Archive className="h-3.5 w-3.5" /> : <Beaker className="h-3.5 w-3.5" />}
                        >
                          {NEXT_BATCH_LABELS[nextStatus]}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </motion.article>
            );
          })}
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Registrar lote de bioplástico"
        description="Vincule a produção às pétalas coletadas e gere o QR Code de rastreabilidade."
        eyebrow="Novo lote"
        icon={<FlaskConical className="h-5 w-5" />}
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="batch-form"
              loading={submitting}
              disabled={availableCollections.length === 0}
            >
              Registrar e gerar QR Code
            </Button>
          </div>
        }
      >
        <form id="batch-form" onSubmit={handleCreate} className="space-y-4">
          {availableCollections.length === 0 ? (
            <Alert tone="warning" title="Nenhuma coleta disponível">
              O lote precisa nascer de pétalas coletadas. Agende e confirme uma coleta antes de
              registrar a produção.{' '}
              <Link to="/app/coletas" className="font-semibold underline underline-offset-2">
                Ir para coletas
              </Link>
            </Alert>
          ) : (
            <Field label="Coleta de origem" htmlFor="batch-collection" required>
              <Select
                id="batch-collection"
                value={form.collectionId}
                onChange={(event) => setForm({ ...form, collectionId: event.target.value })}
                required
              >
                <option value="">Selecione uma coleta</option>
                {availableCollections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.floristOrganization} · {formatKg(collection.weightKg)} ·{' '}
                    {collection.status === 'coletada' ? 'coletada' : 'processada'}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          {selectedCollection && (
            <div className="rounded-2xl border border-line bg-canvas/60 p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
                Origem selecionada
              </p>
              <p className="mt-1 text-sm font-semibold text-ink">
                {selectedCollection.floristOrganization} · {selectedCollection.floristCity}
              </p>
              <p className="text-[11px] text-muted">
                {formatKg(selectedCollection.weightKg)} de pétalas · qualidade{' '}
                {QUALITY_LABELS[selectedCollection.qualityStatus].toLowerCase()} · coleta até{' '}
                {formatDate(selectedCollection.pickupDate)}
              </p>
            </div>
          )}

          <Field label="Formulação" htmlFor="batch-formula" required>
            <Input
              id="batch-formula"
              placeholder="Ex.: V4 · Pétalas + PLA"
              value={form.formulaVersion}
              onChange={(event) => setForm({ ...form, formulaVersion: event.target.value })}
              required
            />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Produzido (kg)" htmlFor="batch-weight" required>
              <Input
                id="batch-weight"
                inputMode="decimal"
                placeholder="Ex.: 4,8"
                value={form.weightProducedKg}
                onChange={(event) => setForm({ ...form, weightProducedKg: event.target.value })}
                required
              />
            </Field>
            <Field label="Biodegradação (dias)" htmlFor="batch-days" required>
              <Input
                id="batch-days"
                type="number"
                min={1}
                max={3650}
                placeholder="Ex.: 35"
                value={form.biodegradationDays}
                onChange={(event) => setForm({ ...form, biodegradationDays: event.target.value })}
                required
              />
            </Field>
            <Field label="Tração (MPa)" htmlFor="batch-tensile" required>
              <Input
                id="batch-tensile"
                inputMode="decimal"
                placeholder="Ex.: 15,2"
                value={form.tensileStrength}
                onChange={(event) => setForm({ ...form, tensileStrength: event.target.value })}
                required
              />
            </Field>
          </div>

          <Field label="Notas técnicas" htmlFor="batch-notes">
            <Textarea
              id="batch-notes"
              placeholder="Parâmetros do ensaio, comportamento do filme, observações da bancada…"
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
            />
          </Field>

          {formError && <Alert tone="error">{formError}</Alert>}

          <Alert tone="info">
            Ao salvar, o sistema gera um código único, o QR Code público e a página de
            rastreabilidade do lote. A coleta de origem passa a constar como processada.
          </Alert>
        </form>
      </Modal>

      <QrModal open={Boolean(qrBatch)} batch={qrBatch} onClose={() => setQrBatch(null)} />
    </div>
  );
}
