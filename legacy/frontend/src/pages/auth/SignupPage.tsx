import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  FlaskConical,
  Flower2,
  Leaf,
  MailCheck,
  ShieldCheck,
  Store,
} from 'lucide-react';
import { AuthShell } from '../../components/auth/AuthShell';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Field, Input } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/Badge';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { cn } from '../../lib/cn';
import { ROLE_LABELS } from '../../lib/status';
import type { Profile } from '../../types';

type SignupRole = 'floricultura' | 'pesquisador_lab' | 'comercio_cliente';

const ROLE_OPTIONS: Array<{
  value: SignupRole;
  label: string;
  description: string;
  icon: typeof Flower2;
}> = [
  {
    value: 'floricultura',
    label: 'Floricultura',
    description: 'Registro pétalas disponíveis e acompanho as coletas da minha loja.',
    icon: Flower2,
  },
  {
    value: 'pesquisador_lab',
    label: 'Laboratório',
    description: 'Crio formulações, lotes de bioplástico e evidências de qualidade.',
    icon: FlaskConical,
  },
  {
    value: 'comercio_cliente',
    label: 'Comércio B2B',
    description: 'Solicito amostras e pedidos de embalagens biodegradáveis.',
    icon: Store,
  },
];

export function SignupPage() {
  const { user, signup } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [role, setRole] = useState<SignupRole>('floricultura');
  const [fullName, setFullName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [city, setCity] = useState('Jaú');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [terms, setTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingUser, setPendingUser] = useState<Profile | null>(null);

  if (user) return <Navigate to="/app" replace />;

  const selectedRole = ROLE_OPTIONS.find((option) => option.value === role)!;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!terms) {
      setError('É necessário aceitar a política de privacidade para criar sua conta.');
      return;
    }
    if (password.length < 8) {
      setError('A senha deve ter ao menos 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      const session = await signup({
        fullName,
        email,
        password,
        role,
        organizationName,
        city,
        phone,
      });

      if (session.pending) {
        setPendingUser(session.user);
        return;
      }

      toast.success('Sua conta está pronta. Bem-vindo ao ciclo!', 'Cadastro concluído');
      navigate('/app', { replace: true });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Não foi possível criar sua conta. Tente novamente.',
      );
    } finally {
      setLoading(false);
    }
  };

  if (pendingUser) {
    return (
      <AuthShell>
        <div className="surface-card overflow-hidden">
          <div className="bg-gradient-to-br from-sage-600 to-sage-800 px-6 py-8 text-white">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15">
              <MailCheck className="h-7 w-7" />
            </span>
            <h1 className="mt-5 font-display text-3xl leading-tight">Conta criada com sucesso.</h1>
            <p className="mt-2 text-sm leading-relaxed text-sage-100/80">
              Sua solicitação foi enviada para a equipe FIH. A aprovação garante a segurança da
              cadeia e costuma acontecer em até 24 horas.
            </p>
          </div>
          <div className="space-y-4 px-6 py-6">
            <div className="rounded-2xl border border-line bg-canvas/60 p-4">
              <p className="text-xs text-muted">Solicitante</p>
              <p className="mt-1 text-sm font-semibold text-ink">{pendingUser.fullName}</p>
              <p className="text-xs text-muted">{pendingUser.email}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-sage-100 px-2.5 py-1 text-[11px] font-semibold text-sage-800 dark:bg-sage-900/50 dark:text-sage-200">
                  {ROLE_LABELS[pendingUser.role]}
                </span>
                <StatusBadge status={pendingUser.status} />
              </div>
            </div>
            <Alert tone="info" title="O que acontece agora?">
              Um SuperAdmin da equipe FIH vai revisar seus dados no painel administrativo. Assim que
              a conta for aprovada, você poderá entrar com o e-mail e a senha cadastrados.
            </Alert>
            <Link to="/login" className="block">
              <Button fullWidth size="lg" iconRight={<ArrowRight className="h-4 w-4" />}>
                Ir para o login
              </Button>
            </Link>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="mb-7">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-sage-200 bg-sage-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-sage-700 dark:border-sage-800 dark:bg-sage-950/40 dark:text-sage-300">
          <Leaf className="h-3.5 w-3.5" />
          Nova parceria
        </span>
        <h1 className="mt-4 font-display text-[2.1rem] leading-tight text-ink">
          Entre para o ciclo.
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Escolha como sua organização participa da cadeia de bioplástico de pétalas de rosas.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <p className="mb-2 text-sm font-medium text-ink">Seu perfil na plataforma</p>
          <div className="grid grid-cols-3 gap-2">
            {ROLE_OPTIONS.map((option) => {
              const selected = role === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRole(option.value)}
                  className={cn(
                    'focus-ring flex flex-col items-center gap-2 rounded-2xl border px-2 py-3 text-center transition',
                    selected
                      ? 'border-sage-500 bg-sage-50 shadow-sm dark:border-sage-600 dark:bg-sage-950/40'
                      : 'border-line bg-surface text-muted hover:border-sage-200',
                  )}
                  aria-pressed={selected}
                >
                  <option.icon
                    className={cn('h-5 w-5', selected ? 'text-sage-600 dark:text-sage-300' : 'text-muted')}
                  />
                  <span
                    className={cn(
                      'text-[11px] font-semibold leading-tight',
                      selected ? 'text-sage-800 dark:text-sage-200' : 'text-muted',
                    )}
                  >
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-muted">{selectedRole.description}</p>
        </div>

        <Field label="Nome completo" htmlFor="signup-name" required>
          <Input
            id="signup-name"
            autoComplete="name"
            placeholder="Como você quer ser chamado"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
          />
        </Field>

        <Field
          label={role === 'floricultura' ? 'Nome da floricultura' : 'Nome da organização'}
          htmlFor="signup-organization"
          required
        >
          <Input
            id="signup-organization"
            autoComplete="organization"
            placeholder={
              role === 'floricultura'
                ? 'Ex.: Floricultura Rosa de Jaú'
                : role === 'pesquisador_lab'
                  ? 'Ex.: Laboratório SENAI Jaú'
                  : 'Ex.: EcoEmbalagens B2B'
            }
            value={organizationName}
            onChange={(event) => setOrganizationName(event.target.value)}
            required
          />
        </Field>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Cidade" htmlFor="signup-city" required>
            <Input
              id="signup-city"
              autoComplete="address-level2"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              required
            />
          </Field>
          <Field label="Telefone" htmlFor="signup-phone" required>
            <Input
              id="signup-phone"
              type="tel"
              autoComplete="tel"
              placeholder="(14) 99999-9999"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              required
            />
          </Field>
        </div>

        <Field label="E-mail" htmlFor="signup-email" required>
          <Input
            id="signup-email"
            type="email"
            autoComplete="email"
            placeholder="voce@empresa.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </Field>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Senha" htmlFor="signup-password" hint="Mínimo de 8 caracteres" required>
            <Input
              id="signup-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </Field>
          <Field
            label="Confirmar senha"
            htmlFor="signup-confirm"
            error={
              confirmPassword.length > 0 && confirmPassword !== password
                ? 'As senhas não coincidem.'
                : undefined
            }
            required
          >
            <Input
              id="signup-confirm"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              hasError={confirmPassword.length > 0 && confirmPassword !== password}
              required
            />
          </Field>
        </div>

        <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-muted">
          <input
            type="checkbox"
            checked={terms}
            onChange={(event) => setTerms(event.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-line accent-sage-600"
          />
          <span>
            Li e aceito a{' '}
            <button
              type="button"
              onClick={() => setShowTerms(true)}
              className="font-semibold text-sage-700 underline-offset-2 hover:underline dark:text-sage-300"
            >
              Política de Privacidade e tratamento de dados (LGPD)
            </button>
            , incluindo o uso das informações para rastreabilidade dos lotes.
          </span>
        </label>

        {error && <Alert tone="error">{error}</Alert>}

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={loading}
          iconRight={<ArrowRight className="h-4 w-4" />}
        >
          Criar minha conta
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Já possui acesso?{' '}
        <Link
          to="/login"
          className="font-semibold text-sage-700 underline-offset-4 hover:underline dark:text-sage-300"
        >
          Entrar
        </Link>
      </p>

      <Modal
        open={showTerms}
        onClose={() => setShowTerms(false)}
        title="Privacidade e LGPD"
        description="Como tratamos os dados da sua organização."
        icon={<ShieldCheck className="h-5 w-5" />}
        footer={
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setTerms(true);
                setShowTerms(false);
              }}
              icon={<CheckCircle2 className="h-4 w-4" />}
            >
              Li e aceito
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-sm leading-relaxed text-muted">
          <p>
            Coletamos apenas os dados necessários para conectar floriculturas, laboratório e
            comércios: nome, e-mail, telefone, organização e cidade. Esses dados não são vendidos nem
            compartilhados com terceiros fora da operação do projeto.
          </p>
          <p>
            As informações de contato não aparecem na página pública de rastreabilidade. O QR Code
            expõe somente a organização de origem, a cidade, o peso das pétalas, a formulação e o
            impacto estimado do lote.
          </p>
          <p>
            Você pode solicitar correção, exportação ou exclusão dos seus dados pelo e-mail da equipe
            FIH. Contas bloqueadas mantêm registros de auditoria de lotes por exigência de
            rastreabilidade, sem exposição pública de dados pessoais.
          </p>
          <p>
            O tratamento segue os princípios da Lei nº 13.709/2018 (LGPD) e as diretrizes das ODS 12,
            14 e 15.
          </p>
        </div>
      </Modal>
    </AuthShell>
  );
}
