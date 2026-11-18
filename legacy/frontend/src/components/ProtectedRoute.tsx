import type { ReactNode } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { LockKeyhole } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { Role } from '../types';
import { FullScreenLoader } from './ui/FullScreenLoader';
import { Button } from './ui/Button';

export function ProtectedRoute({
  children,
  roles,
}: {
  children: ReactNode;
  roles?: Role[];
}) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullScreenLoader />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
        <div className="surface-card max-w-md p-8 text-center">
          <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-petal-100 text-petal-700 dark:bg-petal-900/30 dark:text-petal-300">
            <LockKeyhole className="h-6 w-6" />
          </span>
          <h1 className="font-display text-2xl text-ink">Acesso restrito</h1>
          <p className="mt-2 text-sm text-muted">
            Seu perfil não tem permissão para acessar esta área. Fale com a equipe FIH se precisar
            de um novo nível de acesso.
          </p>
          <Link to="/app" className="mt-6 inline-block">
            <Button>Voltar para a visão geral</Button>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
