import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, KeyRound, ShieldAlert } from 'lucide-react';
import { AuthShell } from '../../components/auth/AuthShell';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Field, Input } from '../../components/ui/Field';
import { api } from '../../lib/api';

function readRecoveryToken(): string | null {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash;
  const hashParams = new URLSearchParams(hash);
  const queryParams = new URLSearchParams(window.location.search);
  return hashParams.get('access_token') ?? queryParams.get('access_token');
}

export function ResetPasswordPage() {
  const [accessToken] = useState<string | null>(readRecoveryToken);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (accessToken) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [accessToken]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('A nova senha deve ter ao menos 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (!accessToken) {
      setError('Link inválido. Solicite uma nova recuperação de senha.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { accessToken, password });
      setSuccess(true);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Não foi possível atualizar a senha. Tente novamente.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      {success ? (
        <div className="surface-card p-6">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-sage-100 text-sage-700 dark:bg-sage-900/40 dark:text-sage-300">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <h1 className="mt-5 font-display text-2xl text-ink">Senha atualizada.</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Sua nova senha já está valendo. Entre na plataforma para continuar acompanhando a cadeia
            circular.
          </p>
          <Link to="/login" className="mt-6 block">
            <Button fullWidth size="lg">
              Ir para o login
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-7">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-sage-100 text-sage-700 dark:bg-sage-900/40 dark:text-sage-300">
              <KeyRound className="h-5 w-5" />
            </span>
            <h1 className="mt-4 font-display text-[2.1rem] leading-tight text-ink">
              Criar nova senha.
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Escolha uma senha forte com pelo menos 8 caracteres. O link de recuperação é de uso
              único.
            </p>
          </div>

          {!accessToken ? (
            <div className="space-y-4">
              <Alert tone="warning" title="Link inválido ou expirado">
                Não encontramos um token de recuperação válido neste endereço. Solicite um novo link
                para continuar.
              </Alert>
              <Link to="/recuperar-senha" className="block">
                <Button fullWidth size="lg" icon={<ShieldAlert className="h-4 w-4" />}>
                  Solicitar novo link
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Nova senha" htmlFor="reset-password" hint="Mínimo de 8 caracteres" required>
                <Input
                  id="reset-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </Field>

              <Field label="Confirmar nova senha" htmlFor="reset-confirm" required>
                <Input
                  id="reset-confirm"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                />
              </Field>

              {error && <Alert tone="error">{error}</Alert>}

              <Button type="submit" fullWidth size="lg" loading={loading}>
                Salvar nova senha
              </Button>
            </form>
          )}
        </>
      )}
    </AuthShell>
  );
}
