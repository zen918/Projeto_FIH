import { Link, NavLink } from 'react-router-dom';
import { Leaf, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { navForRole } from '../../lib/navigation';
import { ROLE_LABELS } from '../../lib/status';
import { cn } from '../../lib/cn';
import { Avatar } from '../ui/Avatar';
import { Logo } from '../ui/Logo';
import { ThemeToggle } from '../ui/ThemeToggle';

export function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const { user } = useAuth();
  if (!user) return null;

  const items = navForRole(user.role);
  const mainItems = items.filter((item) => item.to !== '/app/perfil');
  const accountItems = items.filter((item) => item.to === '/app/perfil');

  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-screen shrink-0 flex-col border-r border-line/70 bg-surface/55 backdrop-blur-xl transition-[width] duration-300 md:flex',
        collapsed ? 'w-[92px]' : 'w-[280px]',
      )}
    >
      <div
        className={cn(
          'flex items-center px-5 pb-4 pt-6',
          collapsed ? 'justify-center' : 'justify-between',
        )}
      >
        <Logo compact={collapsed} to="/app" />
        {!collapsed && (
          <button
            type="button"
            onClick={onToggle}
            className="focus-ring grid h-9 w-9 place-items-center rounded-xl border border-line text-muted transition hover:bg-line/40 hover:text-ink"
            aria-label="Recolher menu lateral"
            title="Recolher menu"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      {collapsed && (
        <button
          type="button"
          onClick={onToggle}
          className="focus-ring mx-auto mb-4 grid h-9 w-9 place-items-center rounded-xl border border-line text-muted transition hover:bg-line/40 hover:text-ink"
          aria-label="Expandir menu lateral"
          title="Expandir menu"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>
      )}

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <p
          className={cn(
            'mb-2 px-3 text-[9px] font-bold uppercase tracking-[0.22em] text-muted/70',
            collapsed && 'sr-only',
          )}
        >
          Navegação
        </p>

        <div className="space-y-1">
          {mainItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all',
                  collapsed && 'justify-center px-0',
                  isActive
                    ? 'bg-sage-600 text-white shadow-soft'
                    : 'text-muted hover:bg-line/40 hover:text-ink',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={cn(
                      'h-[18px] w-[18px] shrink-0 transition-colors',
                      isActive ? 'text-white' : 'text-muted group-hover:text-sage-600',
                    )}
                    strokeWidth={1.9}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </div>

        <p
          className={cn(
            'mb-2 mt-6 px-3 text-[9px] font-bold uppercase tracking-[0.22em] text-muted/70',
            collapsed && 'sr-only',
          )}
        >
          Conta
        </p>

        <div className="space-y-1">
          {accountItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all',
                  collapsed && 'justify-center px-0',
                  isActive
                    ? 'bg-sage-600 text-white shadow-soft'
                    : 'text-muted hover:bg-line/40 hover:text-ink',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={cn(
                      'h-[18px] w-[18px] shrink-0',
                      isActive ? 'text-white' : 'text-muted group-hover:text-sage-600',
                    )}
                    strokeWidth={1.9}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="border-t border-line/70 p-3">
        {!collapsed && (
          <div className="mb-3 overflow-hidden rounded-3xl bg-gradient-to-br from-sage-600 via-sage-700 to-sage-900 p-4 text-white shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-sage-100/70">
                Impacto circular
              </span>
              <Leaf className="h-4 w-4 text-sage-200" />
            </div>
            <p className="mt-3 font-display text-lg leading-tight">Cada coleta fecha um ciclo.</p>
            <p className="mt-1 text-[11px] leading-relaxed text-sage-100/65">
              Pétalas descartadas viram bioplástico com origem rastreável.
            </p>
            <Link
              to="/app"
              className="mt-3 inline-flex text-[11px] font-semibold text-white/90 underline decoration-white/30 underline-offset-4 transition hover:text-white"
            >
              Acompanhar impacto
            </Link>
          </div>
        )}

        <div
          className={cn(
            'flex items-center gap-2 rounded-2xl border border-line bg-canvas/60 p-2',
            collapsed && 'flex-col',
          )}
        >
          <Link to="/app/perfil" className="shrink-0">
            <Avatar name={user.fullName} src={user.avatarUrl} size="sm" />
          </Link>
          {!collapsed && (
            <Link to="/app/perfil" className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-ink">{user.fullName}</p>
              <p className="truncate text-[10px] text-muted">{ROLE_LABELS[user.role]}</p>
            </Link>
          )}
          <ThemeToggle className="h-8 w-8" />
        </div>
      </div>
    </aside>
  );
}
