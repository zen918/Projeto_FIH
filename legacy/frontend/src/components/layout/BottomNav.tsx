import { Link, NavLink } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { NAV_ITEMS, QUICK_ACTIONS, type NavItem } from '../../lib/navigation';
import type { Role } from '../../types';
import { cn } from '../../lib/cn';

function itemFor(role: Role, to: string): NavItem | undefined {
  return NAV_ITEMS.filter((item) => item.roles.includes(role)).find((item) => item.to === to);
}

function bottomItems(role: Role): NavItem[] {
  const dashboard = itemFor(role, '/app');
  const collections = itemFor(role, '/app/coletas');
  const batches = itemFor(role, '/app/lotes');
  const orders = itemFor(role, '/app/pedidos');
  const profile = itemFor(role, '/app/perfil');

  if (role === 'floricultura') {
    return [dashboard, collections, profile].filter(Boolean) as NavItem[];
  }
  if (role === 'comercio_cliente') {
    return [dashboard, batches, orders, profile].filter(Boolean) as NavItem[];
  }
  if (role === 'pesquisador_lab') {
    return [dashboard, collections, batches, orders].filter(Boolean) as NavItem[];
  }
  return [dashboard, collections, batches, orders].filter(Boolean) as NavItem[];
}

export function BottomNav() {
  const { user } = useAuth();
  if (!user) return null;

  const items = bottomItems(user.role);
  const quick = QUICK_ACTIONS[user.role];
  const left = items.slice(0, 2);
  const right = items.slice(2);

  const renderItem = (item: NavItem) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          'flex flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5 transition-colors',
          isActive ? 'text-sage-600 dark:text-sage-400' : 'text-muted',
        )
      }
    >
      {({ isActive }) => (
        <>
          <item.icon className="h-[21px] w-[21px]" strokeWidth={isActive ? 2.3 : 1.8} />
          <span className={cn('text-[9px] font-semibold', isActive && 'text-current')}>
            {item.shortLabel}
          </span>
        </>
      )}
    </NavLink>
  );

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 md:hidden" aria-label="Navegação principal">
      <div className="safe-bottom mx-auto flex max-w-md items-end justify-around border-t border-line/70 bg-surface/80 px-2 pt-2 shadow-[0_-12px_40px_-24px_rgba(0,0,0,0.4)] backdrop-blur-xl">
        {left.map(renderItem)}

        <Link
          to={quick.to}
          className="flex w-[72px] shrink-0 flex-col items-center"
          aria-label={quick.label}
        >
          <span className="-mt-6 grid h-14 w-14 place-items-center rounded-full border-4 border-canvas bg-gradient-to-br from-sage-500 via-sage-600 to-sage-800 text-white shadow-glow transition active:scale-95">
            <Plus className="h-6 w-6" strokeWidth={2.4} />
          </span>
          <span className="mt-0.5 text-center text-[9px] font-bold leading-tight text-sage-700 dark:text-sage-300">
            {quick.label}
          </span>
        </Link>

        {right.map(renderItem)}
      </div>
    </nav>
  );
}
