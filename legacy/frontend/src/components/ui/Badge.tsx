import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { STATUS_META, type BadgeTone } from '../../lib/status';

const TONES: Record<BadgeTone, string> = {
  rose: 'border-petal-200 bg-petal-50 text-petal-800 dark:border-petal-800/60 dark:bg-petal-950/50 dark:text-petal-200',
  sage: 'border-sage-200 bg-sage-50 text-sage-800 dark:border-sage-800/60 dark:bg-sage-950/50 dark:text-sage-200',
  amber:
    'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200',
  zinc: 'border-line bg-line/40 text-muted dark:bg-line/30',
  sky: 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-800/60 dark:bg-sky-950/40 dark:text-sky-200',
  red: 'border-red-200 bg-red-50 text-red-800 dark:border-red-800/60 dark:bg-red-950/40 dark:text-red-200',
};

const DOTS: Record<BadgeTone, string> = {
  rose: 'bg-petal-500',
  sage: 'bg-sage-500',
  amber: 'bg-amber-500',
  zinc: 'bg-stone-400',
  sky: 'bg-sky-500',
  red: 'bg-red-500',
};

export function Badge({
  tone = 'zinc',
  dot = false,
  icon,
  children,
  className,
}: {
  tone?: BadgeTone;
  dot?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none',
        TONES[tone],
        className,
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', DOTS[tone])} />}
      {icon}
      {children}
    </span>
  );
}

export function StatusBadge({
  status,
  className,
  dot = true,
}: {
  status: string;
  className?: string;
  dot?: boolean;
}) {
  const meta = STATUS_META[status] ?? { label: status, tone: 'zinc' as BadgeTone };
  return (
    <Badge tone={meta.tone} dot={dot} className={className}>
      {meta.label}
    </Badge>
  );
}
