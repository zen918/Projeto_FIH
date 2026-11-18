import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, LayoutGrid, LogOut, ShieldCheck, UserRound } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ROLE_LABELS } from '../../lib/status';
import { firstName } from '../../lib/format';
import { Avatar } from '../ui/Avatar';
import { cn } from '../../lib/cn';

export function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointer = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  if (!user) return null;

  const displayName = user.fullName?.trim() || user.email;
  const roleLabel = ROLE_LABELS[user.role] ?? user.role;

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'focus-ring flex items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-2.5 transition hover:border-sage-300',
          open && 'border-sage-300',
        )}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar name={displayName} src={user.avatarUrl} size="sm" />
        <span className="hidden text-left leading-tight sm:block">
          <span className="block max-w-[120px] truncate text-xs font-semibold text-ink">
            {firstName(displayName)}
          </span>
          <span className="block text-[9px] uppercase tracking-wide text-muted">
            {roleLabel.split(' · ')[0]}
          </span>
        </span>
        <ChevronDown
          className={cn('h-4 w-4 text-muted transition-transform', open && 'rotate-180')}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-line bg-surface shadow-soft"
            role="menu"
          >
            <div className="border-b border-line/70 bg-canvas/50 px-4 py-3">
              <p className="truncate text-sm font-semibold text-ink">{displayName}</p>
              <p className="truncate text-xs text-muted">{user.email}</p>
              <span className="mt-2 inline-flex rounded-full bg-sage-100 px-2 py-0.5 text-[10px] font-semibold text-sage-800 dark:bg-sage-900/50 dark:text-sage-200">
                {roleLabel}
              </span>
            </div>

            <div className="p-1.5">
              <Link
                to="/app"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink transition hover:bg-line/40"
                role="menuitem"
              >
                <LayoutGrid className="h-4 w-4 text-muted" />
                Visão geral
              </Link>
              <Link
                to="/app/perfil"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink transition hover:bg-line/40"
                role="menuitem"
              >
                <UserRound className="h-4 w-4 text-muted" />
                Meu perfil
              </Link>
              {user.role === 'superadmin' && (
                <Link
                  to="/app/admin"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink transition hover:bg-line/40"
                  role="menuitem"
                >
                  <ShieldCheck className="h-4 w-4 text-muted" />
                  Administração
                </Link>
              )}
            </div>

            <div className="border-t border-line/70 p-1.5">
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-950/30"
                role="menuitem"
              >
                <LogOut className="h-4 w-4" />
                {loggingOut ? 'Saindo…' : 'Sair da conta'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
