import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';
import { initials } from '../../lib/format';

const SIZES = {
  xs: 'h-7 w-7 text-[10px]',
  sm: 'h-9 w-9 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-24 w-24 text-2xl',
};

export function Avatar({
  name,
  src,
  size = 'md',
  className,
  ring = false,
}: {
  name: string;
  src?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
  ring?: boolean;
}) {
  return (
    <span
      className={cn(
        'relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-petal-200 via-petal-100 to-sage-200 font-bold text-stone-700 dark:from-petal-800 dark:via-petal-900 dark:to-sage-900 dark:text-petal-100',
        ring && 'ring-2 ring-surface ring-offset-2 ring-offset-sage-500',
        SIZES[size],
        className,
      )}
      aria-hidden
    >
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <span>{initials(name)}</span>
      )}
    </span>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'surface-card flex flex-col items-center justify-center px-6 py-14 text-center',
        className,
      )}
    >
      <span className="mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-sage-100 text-sage-700 dark:bg-sage-900/40 dark:text-sage-300">
        <Icon className="h-7 w-7" />
      </span>
      <h3 className="font-display text-xl text-ink">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
