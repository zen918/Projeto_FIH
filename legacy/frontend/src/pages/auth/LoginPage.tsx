import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Eye,
  EyeOff,
  FlaskConical,
  Flower2,
  Leaf,
  Loader2,
  ShieldCheck,
  Store,
} from 'lucide-react';
import { AuthShell } from '../../components/auth/AuthShell';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Field, Input } from '../../components/ui/Field';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../lib/api';
import type { DemoAccountsResponse, Role } from '../../types';

const ROLE_ICONS: Record<string, typeof ShieldCheck> = {
  superadmin: ShieldCheck,
  floricultura: Flower2,
  pesquisador_lab: FlaskConical,
  comercio_cliente: Store,
};

export function LoginPage() {
  const { user, login, demoMode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [demoAccounts, setDemoAccounts] = useState<DemoAccountsResponse | null>(null);

  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/app';

  useEffect(() => {
    if (!demoMode) return;
    api
      .get<DemoAccountsResponse>('/auth/demo-accounts')
      .then(setDemoAccounts)
      .catch(() => setDemoAccounts(null));
  }, [demoMode]);

  if (user) return <Navigate to={redirectTo} replace />;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Que bom ter você de volta!', 'Sessão iniciada');
      navigate(redirectTo, { replace: true });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Não foi possível entrar. Tente novamente.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (accountEmail: string) => {
    setError(null);
    setDemoLoading(accountEmail);
    setEmail(accountEmail);
    setPassword(demoAccounts?.password ?? 'Demo@1234');
    try {
      await login(accountEmail, demoAccounts?.password ?? 'Demo@1234');
      toast.success('Conta de demonstração carregada.', 'Sessão iniciada');
      navigate('/app', { replace: true });
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : 'Não foi possível entrar na demo.',
      );
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <AuthShell>
      <div className="mb-8">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-sage-200 bg-sage-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-sage-700 dark:border-sage-800 dark:bg-sage-950/40 dark:text-sage-300">
          <Leaf className="h-3.5 w-3.5" />
          Plataforma oficial
        </span>
        <h1 className="mt-4 font-display text-[2.1rem] leading-tight text-ink">
          Bem-vindo de volta.
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Entre para acompanhar coletas, lotes de bioplástico e o impacto circular da sua operação.
        </p>
      </div>

      {demoAccounts && (
        <div className="mb-6 rounded-3xl border border-dashed border-petal-200 bg-petal-50/60 p-4 dark:border-petal-800/60 dark:bg-petal-950/20">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-petal-700 dark:text-petal-300">
              Acesso rápido · demonstração
            </p>
            <span className="rounded-full bg-white/70 px-2 py-0.5 font-mono text-[10px] text-petal-700 dark:bg-petal-900/40 dark:text-petal-200">
              {demoAccounts.password}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {demoAccounts.accounts.map((account) => {
              const Icon = ROLE_ICONS[account.role as Role] ?? ShieldCheck;
              const isLoading = demoLoading === account.email;
              return (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => handleDemoLogin(account.email)}
                  disabled={Boolean(demoLoading) || loading}
                  className="focus-ring group flex items-center gap-2 rounded-2xl border border-transparent bg-surface/70 p-2.5 text-left transition hover:border-petal-200 hover:bg-surface disabled:opacity-60 dark:hover:border-petal-800"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-petal-100 text-petal-700 dark:bg-petal-900/40 dark:text-petal-200">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11px] font-semibold text-ink">
                      {account.label}
                    </span>
                    <span className="block truncate text-[10px] text-muted">{account.email}</span>
                  </span>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-petal-500" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4 text-muted transition group-hover:text-petal-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="E-mail" htmlFor="login-email" required>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="voce@empresa.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </Field>

        <Field label="Senha" htmlFor="login-password" required>
          <div className="relative">
            <Input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Sua senha"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="pr-12"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="focus-ring absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-muted transition hover:bg-line/50 hover:text-ink"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>

        <div className="flex justify-end">
          <Link
            to="/recuperar-senha"
            className="text-xs font-semibold text-sage-700 underline-offset-4 transition hover:underline dark:text-sage-300"
          >
            Esqueci minha senha
          </Link>
        </div>

        {error && <Alert tone="error">{error}</Alert>}

        <Button type="submit" fullWidth size="lg" loading={loading} iconRight={<ArrowRight className="h-4 w-4" />}>
          Entrar na plataforma
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Ainda não tem uma conta?{' '}
        <Link
          to="/cadastro"
          className="font-semibold text-sage-700 underline-offset-4 hover:underline dark:text-sage-300"
        >
          Criar conta
        </Link>
      </p>
    </AuthShell>
  );
}
