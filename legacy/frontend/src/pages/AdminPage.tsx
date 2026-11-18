import { useMemo, useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import {
  BadgeCheck,
  Ban,
  Building2,
  CheckCircle2,
  MapPin,
  Search,
  ShieldCheck,
  ShieldOff,
  UserCog,
  UserRoundCheck,
  Users,
} from 'lucide-react';
import { Alert } from '../components/ui/Alert';
import { Avatar, EmptyState } from '../components/ui/Avatar';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { Field, Input, Select } from '../components/ui/Field';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { SkeletonCard } from '../components/ui/Skeleton';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useApiData } from '../hooks/useApiData';
import { api } from '../lib/api';
import { cn } from '../lib/cn';
import { formatDate, timeAgo } from '../lib/format';
import {
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  ROLE_SHORT_LABELS,
  ROLE_TONES,
  USER_STATUS_OPTIONS,
} from '../lib/status';
import type { Profile, Role, UserStatus } from '../types';

const EMPTY_COUNTS: Record<string, number> = {};

export function AdminPage() {
  const { user } = useAuth();
  const toast = useToast();

  const { data, loading, error, refresh } = useApiData<{ users: Profile[] }>('/admin/users');

  const [statusFilter, setStatusFilter] = useState<'todos' | UserStatus>('todos');
  const [roleFilter, setRoleFilter] = useState<'todos' | Role>('todos');
  const [query, setQuery] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);
  const [blockTarget, setBlockTarget] = useState<Profile | null>(null);

  const [manageTarget, setManageTarget] = useState<Profile | null>(null);
  const [manageRole, setManageRole] = useState<Role>('floricultura');
  const [manageStatus, setManageStatus] = useState<UserStatus>('active');
  const [manageError, setManageError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const users = data?.users ?? [];

  const counts = useMemo(() => {
    const result: Record<string, number> = { ...EMPTY_COUNTS, todos: users.length };
    for (const item of users) {
      result[item.status] = (result[item.status] ?? 0) + 1;
      result[item.role] = (result[item.role] ?? 0) + 1;
    }
    return result;
  }, [users]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return users.filter((item) => {
      const matchesStatus = statusFilter === 'todos' || item.status === statusFilter;
      const matchesRole = roleFilter === 'todos' || item.role === roleFilter;
      const haystack = [
        item.fullName,
        item.email,
        item.organizationName,
        item.city,
        ROLE_LABELS[item.role],
      ]
        .join(' ')
        .toLowerCase();
      return matchesStatus && matchesRole && (!normalized || haystack.includes(normalized));
    });
  }, [users, statusFilter, roleFilter, query]);

  if (!user) return null;

  const openManage = (target: Profile) => {
    setManageTarget(target);
    setManageRole(target.role);
    setManageStatus(target.status);
    setManageError(null);
  };

  const applyStatus = async (target: Profile, status: UserStatus) => {
    setActionId(target.id);
    try {
      await api.patch<{ user: Profile }>(`/admin/users/${target.id}`, { status });
      const message =
        status === 'active'
          ? target.status === 'pending'
            ? 'Cadastro aprovado. A pessoa já pode acessar a plataforma.'
            : 'Conta reativada com sucesso.'
          : 'Conta bloqueada. O acesso à plataforma foi interrompido.';
      toast.success(message, 'Acesso atualizado');
      setBlockTarget(null);
      await refresh();
    } catch (actionError) {
      toast.error(
        actionError instanceof Error
          ? actionError.message
          : 'Não foi possível atualizar a conta.',
      );
    } finally {
      setActionId(null);
    }
  };

  const handleManage = async (event: FormEvent) => {
    event.preventDefault();
    if (!manageTarget) return;
    setManageError(null);

    const patch: { role?: Role; status?: UserStatus } = {};
    if (manageRole !== manageTarget.role) patch.role = manageRole;
    if (manageStatus !== manageTarget.status) patch.status = manageStatus;

    if (!patch.role && !patch.status) {
      setManageError('Escolha um novo perfil ou status para salvar.');
      return;
    }

    setSaving(true);
    try {
      await api.patch<{ user: Profile }>(`/admin/users/${manageTarget.id}`, patch);
      toast.success(`Acesso de ${manageTarget.fullName} atualizado.`, 'Permissões salvas');
      setManageTarget(null);
      await refresh();
    } catch (actionError) {
      setManageError(
        actionError instanceof Error
          ? actionError.message
          : 'Não foi possível salvar as permissões.',
      );
    } finally {
      setSaving(false);
    }
  };

  const stats = [
    {
      label: 'Contas totais',
      value: counts.todos ?? 0,
      icon: Users,
      tone: 'bg-canvas text-muted',
    },
    {
      label: 'Ativas',
      value: counts.active ?? 0,
      icon: UserRoundCheck,
      tone: 'bg-sage-100 text-sage-700 dark:bg-sage-900/40 dark:text-sage-300',
    },
    {
      label: 'Em análise',
      value: counts.pending ?? 0,
      icon: ShieldCheck,
      tone: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    },
    {
      label: 'Bloqueadas',
      value: counts.blocked ?? 0,
      icon: ShieldOff,
      tone: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Governança da plataforma"
        title="Administração"
        description="Aprove novos parceiros, bloqueie acessos de risco e ajuste permissões. Toda alteração fica registrada para auditoria da equipe FIH."
      />

      {(counts.pending ?? 0) > 0 && (
        <Alert tone="warning" className="mb-5" title="Cadastros aguardando você">
          {counts.pending} conta{(counts.pending ?? 0) > 1 ? 's' : ''} em análise. Aprovar libera o
          acesso imediatamente; recusar mantém o registro bloqueado para eventual revisão.
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
          </Card>
        ))}
      </div>

      <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setStatusFilter('todos')}
            className={cn(
              'focus-ring shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition',
              statusFilter === 'todos'
                ? 'border-sage-600 bg-sage-600 text-white'
                : 'border-line bg-surface text-muted hover:text-ink',
            )}
          >
            Todos ({counts.todos ?? 0})
          </button>
          {USER_STATUS_OPTIONS.map((status) => (
            <button
              key={status.value}
              type="button"
              onClick={() => setStatusFilter(status.value)}
              className={cn(
                'focus-ring shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition',
                statusFilter === status.value
                  ? 'border-sage-600 bg-sage-600 text-white'
                  : 'border-line bg-surface text-muted hover:text-ink',
              )}
            >
              {status.label} ({counts[status.value] ?? 0})
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value as 'todos' | Role)}
            aria-label="Filtrar por perfil"
            className="sm:w-56"
          >
            <option value="todos">Todos os perfis ({counts.todos ?? 0})</option>
            {(Object.keys(ROLE_SHORT_LABELS) as Role[]).map((role) => (
              <option key={role} value={role}>
                {ROLE_SHORT_LABELS[role]} ({counts[role] ?? 0})
              </option>
            ))}
          </Select>

          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar nome, e-mail, cidade…"
              className="pl-10"
              aria-label="Buscar contas"
            />
          </div>
        </div>
      </div>

      {error && (
        <Alert tone="error" className="mb-4" title="Não foi possível carregar as contas">
          {error}
        </Alert>
      )}

      {loading && users.length === 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} lines={3} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={users.length === 0 ? 'Nenhuma conta cadastrada' : 'Nenhuma conta encontrada'}
          description={
            users.length === 0
              ? 'Os cadastros de floriculturas, laboratório e comércio aparecerão aqui para aprovação.'
              : 'Ajuste o status, o perfil ou a busca para localizar outra conta.'
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item, index) => {
            const isSelf = item.id === user.id;
            const busy = actionId === item.id;

            return (
              <motion.article
                key={item.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.26, delay: Math.min(index * 0.03, 0.2) }}
                className="surface-card flex flex-col p-5"
              >
                <div className="flex items-start gap-3">
                  <Avatar name={item.fullName} src={item.avatarUrl} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="truncate text-sm font-semibold text-ink">{item.fullName}</h3>
                      {isSelf && (
                        <span className="shrink-0 rounded-full bg-sage-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-sage-800 dark:bg-sage-900/50 dark:text-sage-200">
                          você
                        </span>
                      )}
                    </div>
                    <p className="truncate text-[11px] text-muted">{item.email}</p>
                    <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-muted">
                      <Building2 className="h-3 w-3 shrink-0" />
                      {item.organizationName}
                    </p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-1.5">
                  <Badge tone={ROLE_TONES[item.role]} dot>
                    {ROLE_SHORT_LABELS[item.role]}
                  </Badge>
                  <Badge tone="zinc">
                    <MapPin className="h-3 w-3" />
                    {item.city}
                  </Badge>
                </div>

                <div className="mt-3 rounded-2xl border border-line px-3.5 py-3">
                  <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted">
                    Escopo de acesso
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted">
                    {ROLE_DESCRIPTIONS[item.role]}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between text-[10px] text-muted">
                  <span>Cadastro {timeAgo(item.createdAt)}</span>
                  <span>Desde {formatDate(item.createdAt)}</span>
                </div>

                <div className="mt-auto flex flex-wrap items-center gap-1.5 border-t border-line/70 pt-3">
                  {isSelf ? (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-sage-700 dark:text-sage-300">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      Sua conta está protegida contra autoalteração.
                    </span>
                  ) : (
                    <>
                      {item.status === 'pending' && (
                        <Button
                          size="sm"
                          loading={busy}
                          onClick={() => void applyStatus(item, 'active')}
                          icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                        >
                          Aprovar
                        </Button>
                      )}

                      {item.status === 'active' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busy}
                          onClick={() => setBlockTarget(item)}
                          icon={<Ban className="h-3.5 w-3.5" />}
                        >
                          Bloquear
                        </Button>
                      )}

                      {item.status === 'blocked' && (
                        <Button
                          size="sm"
                          loading={busy}
                          onClick={() => void applyStatus(item, 'active')}
                          icon={<UserRoundCheck className="h-3.5 w-3.5" />}
                        >
                          Reativar
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openManage(item)}
                        disabled={busy}
                        icon={<UserCog className="h-3.5 w-3.5" />}
                      >
                        Gerenciar acesso
                      </Button>
                    </>
                  )}
                </div>
              </motion.article>
            );
          })}
        </div>
      )}

      <ConfirmModal
        open={Boolean(blockTarget)}
        title="Bloquear esta conta?"
        description={
          blockTarget
            ? `${blockTarget.fullName} (${blockTarget.email}) perderá o acesso à plataforma imediatamente. Os registros de lotes e a rastreabilidade pública continuam preservados para auditoria.`
            : ''
        }
        confirmLabel="Sim, bloquear acesso"
        loading={actionId === blockTarget?.id}
        onCancel={() => setBlockTarget(null)}
        onConfirm={() => {
          if (blockTarget) void applyStatus(blockTarget, 'blocked');
        }}
      />

      <Modal
        open={Boolean(manageTarget)}
        onClose={() => setManageTarget(null)}
        title={manageTarget ? `Gerenciar acesso de ${manageTarget.fullName}` : 'Gerenciar acesso'}
        description="Altere o perfil de permissão e o status da conta. A mudança vale no próximo acesso."
        eyebrow="Permissões"
        icon={<UserCog className="h-5 w-5" />}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setManageTarget(null)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" form="admin-user-form" loading={saving}>
              Salvar permissões
            </Button>
          </div>
        }
      >
        {manageTarget && (
          <form id="admin-user-form" onSubmit={handleManage} className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl border border-line bg-canvas/60 p-3.5">
              <Avatar name={manageTarget.fullName} src={manageTarget.avatarUrl} size="md" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">
                  {manageTarget.organizationName}
                </p>
                <p className="truncate text-[11px] text-muted">{manageTarget.email}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <Badge tone={ROLE_TONES[manageTarget.role]}>
                    {ROLE_SHORT_LABELS[manageTarget.role]}
                  </Badge>
                  <StatusBadge status={manageTarget.status} dot={false} />
                </div>
              </div>
            </div>

            <Field label="Perfil na plataforma" htmlFor="admin-role" required>
              <Select
                id="admin-role"
                value={manageRole}
                onChange={(event) => setManageRole(event.target.value as Role)}
              >
                {(Object.keys(ROLE_LABELS) as Role[]).map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </Select>
            </Field>
            <p className="-mt-2 text-[11px] leading-relaxed text-muted">
              {ROLE_DESCRIPTIONS[manageRole]}
            </p>

            <Field label="Status da conta" htmlFor="admin-status" required>
              <Select
                id="admin-status"
                value={manageStatus}
                onChange={(event) => setManageStatus(event.target.value as UserStatus)}
              >
                {USER_STATUS_OPTIONS.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </Select>
            </Field>

            {manageError && <Alert tone="error">{manageError}</Alert>}

            <Alert tone="info" title="Proteções automáticas">
              O sistema impede alterar a própria conta e garante que ao menos um SuperAdmin
              permaneça ativo na plataforma.
            </Alert>
          </form>
        )}
      </Modal>
    </div>
  );
}
