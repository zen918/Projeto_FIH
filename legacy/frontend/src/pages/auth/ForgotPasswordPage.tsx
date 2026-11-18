import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MailCheck, Send } from 'lucide-react';
import { AuthShell } from '../../components/auth/AuthShell';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Field, Input } from '../../components/ui/Field';
import { api } from '../../lib/api';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ demo: boolean; message: string } | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await api.post<{ demo: boolean; message: string }>('/auth/forgot-password', {
        email,
      });
      setResult(response);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Não foi possível enviar o link. Tente novamente.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <Link
        to="/login"
        className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Voltar para o login
      </Link>

      {result ? (
        <div className="surface-card p-6">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-sage-100 text-sage-700 dark:bg-sage-900/40 dark:text-sage-300">
            <MailCheck className="h-7 w-7" />
          </span>
          <h1 className="mt-5 font-display text-2xl text-ink">Verifique seu e-mail.</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">{result.message}</p>
          {result.demo && (
            <Alert tone="info" className="mt-4" title="Modo demonstração">
              Entre com qualquer conta de exemplo usando a senha <strong>Demo@1234</strong>.
            </Alert>
          )}
          <Link to="/login" className="mt-6 block">
            <Button fullWidth size="lg" variant="outline">
              Voltar para o login
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-7">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-petal-100 text-petal-700 dark:bg-petal-900/40 dark:text-petal-200">
              <Send className="h-5 w-5" />
            </span>
            <h1 className="mt-4 font-display text-[2.1rem] leading-tight text-ink">
              Recuperar acesso.
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Informe o e-mail cadastrado e enviaremos um link seguro para você criar uma nova senha.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="E-mail" htmlFor="forgot-email" required>
              <Input
                id="forgot-email"
                type="email"
                autoComplete="email"
                placeholder="voce@empresa.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </Field>

            {error && <Alert tone="error">{error}</Alert>}

            <Button type="submit" fullWidth size="lg" loading={loading}>
              Enviar link de redefinição
            </Button>
          </form>
        </>
      )}
    </AuthShell>
  );
}
