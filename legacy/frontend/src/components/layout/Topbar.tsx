import { useLocation } from 'react-router-dom';
import { FlaskConical } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PAGE_TITLES } from '../../lib/navigation';
import { Logo } from '../ui/Logo';
import { ThemeToggle } from '../ui/ThemeToggle';
import { UserMenu } from './UserMenu';

export function Topbar() {
  const location = useLocation();
  const { demoMode } = useAuth();
  const page = PAGE_TITLES[location.pathname] ?? {
    title: 'Plataforma',
    subtitle: 'Plastikkimik Pytangy',
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-surface/70 backdrop-blur-xl">
      <div className="flex h-[70px] items-center gap-3 px-4 sm:px-6 md:px-8">
        <div className="flex items-center gap-2 md:hidden">
          <Logo compact to="/app" />
          <div className="leading-tight">
            <p className="font-display text-[17px] text-ink">Pytangy</p>
            <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-muted">
              {page.title}
            </p>
          </div>
        </div>

        <div className="hidden min-w-0 md:block">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted/80">
            <span>Plataforma</span>
            <span className="text-line">/</span>
            <span className="text-sage-600 dark:text-sage-400">{page.title}</span>
          </div>
          <p className="truncate text-sm font-medium text-ink">{page.subtitle}</p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {demoMode && (
            <span className="hidden items-center gap-1.5 rounded-full border border-petal-200 bg-petal-50/80 px-3 py-1.5 text-[10px] font-semibold text-petal-700 sm:inline-flex dark:border-petal-800/60 dark:bg-petal-950/40 dark:text-petal-200">
              <FlaskConical className="h-3.5 w-3.5" />
              Modo demo · dados em memória
            </span>
          )}
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
