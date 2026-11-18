import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2,
  Camera,
  Check,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Moon,
  Palette,
  Phone,
  ShieldCheck,
  Sun,
  UserRound,
} from 'lucide-react';
import { Alert } from '../components/ui/Alert';
import { Avatar } from '../components/ui/Avatar';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { Field, Input } from '../components/ui/Field';
import { PageHeader } from '../components/ui/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { api } from '../lib/api';
import { cn } from '../lib/cn';
import { formatDate } from '../lib/format';
import {
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  ROLE_SHORT_LABELS,
  ROLE_TONES,
} from '../lib/status';
import type { Profile } from '../types';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SOURCE_BYTES = 8 * 1024 * 1024;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Não foi possível abrir a imagem selecionada.'));
    };
    image.src = url;
  });
}

async function compressAvatar(file: File): Promise<Blob> {
  const image = await loadImage(file);
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Seu navegador não conseguiu processar a imagem.');

  const side = Math.min(image.naturalWidth, image.naturalHeight);
  const sourceX = (image.naturalWidth - side) / 2;
  const sourceY = (image.naturalHeight - side) / 2;

  context.fillStyle = '#fdf5f3';
  context.fillRect(0, 0, size, size);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, sourceX, sourceY, side, side, 0, 0, size, size);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result);
        else reject(new Error('Não foi possível otimizar a imagem.'));
      },
      'image/jpeg',
      0.9,
    );
  });

  return blob;
}

interface ProfileForm {
  fullName: string;
  organizationName: string;
  city: string;
  phone: string;
}

function formFromProfile(profile: Profile): ProfileForm {
  return {
    fullName: profile.fullName,
    organizationName: profile.organizationName,
    city: profile.city,
    phone: profile.phone,
  };
}

export function ProfilePage() {
  const { user, demoMode, updateCurrentUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState<ProfileForm>({
    fullName: user?.fullName ?? '',
    organizationName: user?.organizationName ?? '',
    city: user?.city ?? '',
    phone: user?.phone ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const previewRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [logoutOpen, setLogoutOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (user) setForm(formFromProfile(user));
  }, [user?.id]);

  useEffect(
    () => () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    },
    [],
  );

  if (!user) return null;

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (form.fullName.trim().length < 3) {
      setFormError('Informe seu nome completo.');
      return;
    }
    if (form.organizationName.trim().length < 2) {
      setFormError('Informe o nome da sua organização.');
      return;
    }
    if (form.city.trim().length < 2) {
      setFormError('Informe sua cidade.');
      return;
    }
    if (form.phone.trim().length < 8) {
      setFormError('Informe um telefone válido com DDD.');
      return;
    }

    setSaving(true);
    try {
      const { user: updated } = await api.patch<{ user: Profile }>('/profile', {
        fullName: form.fullName.trim(),
        organizationName: form.organizationName.trim(),
        city: form.city.trim(),
        phone: form.phone.trim(),
      });
      updateCurrentUser(updated);
      setForm(formFromProfile(updated));
      toast.success('Seus dados cadastrais foram atualizados.', 'Perfil salvo');
    } catch (saveError) {
      setFormError(
        saveError instanceof Error ? saveError.message : 'Não foi possível salvar o perfil.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Selecione uma imagem JPG, PNG ou WEBP.');
      return;
    }
    if (file.size > MAX_SOURCE_BYTES) {
      toast.error('A imagem original deve ter no máximo 8 MB.');
      return;
    }

    setUploading(true);
    try {
      const blob = await compressAvatar(file);

      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
      const previewUrl = URL.createObjectURL(blob);
      previewRef.current = previewUrl;
      setAvatarPreview(previewUrl);

      const formData = new FormData();
      formData.append('file', blob, 'avatar.jpg');

      const { user: updated } = await api.upload<{ user: Profile }>('/profile/avatar', formData);
      updateCurrentUser(updated);
      toast.success('Sua nova foto já está no perfil.', 'Foto atualizada');
    } catch (uploadError) {
      toast.error(
        uploadError instanceof Error
          ? uploadError.message
          : 'Não foi possível atualizar a foto.',
      );
    } finally {
      setUploading(false);
      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current);
        previewRef.current = null;
      }
      setAvatarPreview(null);
    }
  };

  const handleLogout = async () => {
    setLeaving(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } finally {
      setLeaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Sua conta"
        title="Meu perfil"
        description="Mantenha os dados da sua organização atualizados para agilizar aprovações, coletas e pedidos B2B."
      />

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32 }}
        className="relative mb-6 overflow-hidden rounded-4xl bg-gradient-to-br from-stone-950 via-sage-950 to-stone-900 p-6 text-white shadow-soft sm:p-8"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-petal-500/25 blur-3xl" />
          <div className="absolute -bottom-28 left-1/4 h-64 w-64 rounded-full bg-sage-500/20 blur-3xl" />
          <div className="absolute inset-0 bg-grid opacity-[0.05]" />
        </div>

        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="relative shrink-0">
            <Avatar
              name={user.fullName}
              src={avatarPreview ?? user.avatarUrl}
              size="xl"
              className="ring-4 ring-white/15"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="focus-ring absolute -bottom-1 -right-1 grid h-10 w-10 place-items-center rounded-full border-4 border-stone-900 bg-petal-500 text-white shadow-glow transition hover:bg-petal-400 disabled:opacity-70"
              aria-label="Trocar foto do perfil"
              title="Trocar foto"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => {
                void handleAvatar(event);
              }}
            />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={ROLE_TONES[user.role]} dot>
                {ROLE_SHORT_LABELS[user.role]}
              </Badge>
              <StatusBadge status={user.status} />
              {demoMode && (
                <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-white/65">
                  Demonstração
                </span>
              )}
            </div>
            <h2 className="mt-3 font-display text-3xl leading-tight text-white sm:text-4xl">
              {user.fullName}
            </h2>
            <p className="mt-1.5 text-sm text-white/60">
              {user.organizationName} · {user.city}
            </p>
            <p className="mt-0.5 text-xs text-white/40">{user.email}</p>
            <p className="mt-3 text-[11px] text-white/35">
              Na plataforma desde {formatDate(user.createdAt)} · foto quadrada otimizada em 512 px
            </p>
          </div>

          <div className="sm:ml-auto">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              loading={uploading}
              icon={<Camera className="h-4 w-4" />}
              className="border-white/20 bg-white/10 text-white hover:border-white/40 hover:bg-white/15"
            >
              Trocar foto
            </Button>
          </div>
        </div>
      </motion.section>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <Card className="p-5 sm:p-6">
          <CardHeader
            title="Dados cadastrais"
            description="Essas informações identificam sua organização na cadeia circular."
            icon={<UserRound className="h-5 w-5" />}
          />

          <form onSubmit={handleSave} className="mt-5 space-y-4">
            <Field label="Nome completo" htmlFor="profile-name" required>
              <Input
                id="profile-name"
                autoComplete="name"
                value={form.fullName}
                onChange={(event) => setForm({ ...form, fullName: event.target.value })}
                required
              />
            </Field>

            <Field
              label="Organização"
              htmlFor="profile-organization"
              hint="Nome que aparece nas coletas, lotes e pedidos."
              required
            >
              <Input
                id="profile-organization"
                autoComplete="organization"
                value={form.organizationName}
                onChange={(event) => setForm({ ...form, organizationName: event.target.value })}
                required
              />
            </Field>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Cidade" htmlFor="profile-city" required>
                <Input
                  id="profile-city"
                  autoComplete="address-level2"
                  value={form.city}
                  onChange={(event) => setForm({ ...form, city: event.target.value })}
                  required
                />
              </Field>
              <Field label="Telefone" htmlFor="profile-phone" required>
                <Input
                  id="profile-phone"
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(event) => setForm({ ...form, phone: event.target.value })}
                  required
                />
              </Field>
            </div>

            <Field
              label="E-mail de acesso"
              htmlFor="profile-email"
              hint="O e-mail é usado para login e recuperação de senha. Fale com a equipe FIH para alterá-lo."
            >
              <Input id="profile-email" type="email" value={user.email} readOnly disabled />
            </Field>

            {formError && <Alert tone="error">{formError}</Alert>}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line/70 pt-4">
              <p className="text-[11px] text-muted">
                Alterações são registradas na trilha de auditoria da plataforma.
              </p>
              <Button type="submit" loading={saving} icon={<Check className="h-4 w-4" />}>
                Salvar alterações
              </Button>
            </div>
          </form>
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <CardHeader
              title="Preferências"
              description="Ajuste a aparência da plataforma."
              icon={<Palette className="h-5 w-5" />}
            />
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTheme('light')}
                aria-pressed={theme === 'light'}
                className={cn(
                  'focus-ring flex flex-col items-center gap-2 rounded-2xl border p-3 text-xs font-semibold transition',
                  theme === 'light'
                    ? 'border-sage-500 bg-sage-50 text-sage-800 dark:border-sage-600 dark:bg-sage-950/40 dark:text-sage-200'
                    : 'border-line bg-surface text-muted hover:border-sage-200 hover:text-ink',
                )}
              >
                <Sun className="h-5 w-5" />
                Tema claro
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                aria-pressed={theme === 'dark'}
                className={cn(
                  'focus-ring flex flex-col items-center gap-2 rounded-2xl border p-3 text-xs font-semibold transition',
                  theme === 'dark'
                    ? 'border-sage-500 bg-sage-50 text-sage-800 dark:border-sage-600 dark:bg-sage-950/40 dark:text-sage-200'
                    : 'border-line bg-surface text-muted hover:border-sage-200 hover:text-ink',
                )}
              >
                <Moon className="h-5 w-5" />
                Tema escuro
              </button>
            </div>
            <p className="mt-3 text-[10px] leading-relaxed text-muted">
              A preferência fica salva neste navegador e acompanha todas as páginas.
            </p>
          </Card>

          <Card className="p-5">
            <CardHeader
              title="Conta e segurança"
              description="Informações de acesso da sua conta."
              icon={<ShieldCheck className="h-5 w-5" />}
            />
            <div className="mt-4 space-y-3">
              <div className="flex items-start gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wide text-muted">e-mail</p>
                  <p className="truncate text-sm font-medium text-ink">{user.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wide text-muted">perfil</p>
                  <p className="text-sm font-medium text-ink">{ROLE_LABELS[user.role]}</p>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-muted">
                    {ROLE_DESCRIPTIONS[user.role]}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wide text-muted">operação</p>
                  <p className="text-sm font-medium text-ink">{user.organizationName}</p>
                  <p className="text-[11px] text-muted">{user.city}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wide text-muted">telefone</p>
                  <p className="text-sm font-medium text-ink">{user.phone}</p>
                </div>
              </div>
            </div>

            <Link
              to="/recuperar-senha"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-sage-700 underline-offset-4 hover:underline dark:text-sage-300"
            >
              <KeyRound className="h-3.5 w-3.5" />
              Redefinir minha senha
            </Link>

            {demoMode && (
              <Alert tone="info" className="mt-4" title="Modo demonstração">
                A foto é armazenada apenas em memória neste ambiente. Reiniciar a API restaura os
                dados originais da demonstração.
              </Alert>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                <LogOut className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">Encerrar sessão</p>
                <p className="text-[11px] text-muted">Você poderá entrar novamente quando quiser.</p>
              </div>
            </div>
            <Button
              variant="outline"
              fullWidth
              className="mt-4 border-red-200 text-red-700 hover:border-red-300 hover:bg-red-50 dark:border-red-900/60 dark:text-red-300 dark:hover:bg-red-950/30"
              onClick={() => setLogoutOpen(true)}
              icon={<LogOut className="h-4 w-4" />}
            >
              Sair da conta
            </Button>
          </Card>
        </div>
      </div>

      <ConfirmModal
        open={logoutOpen}
        title="Sair da plataforma?"
        description="Sua sessão será encerrada neste navegador. Nenhum dado da operação será apagado."
        confirmLabel="Sim, sair agora"
        loading={leaving}
        onCancel={() => setLogoutOpen(false)}
        onConfirm={() => void handleLogout()}
      />
    </div>
  );
}
