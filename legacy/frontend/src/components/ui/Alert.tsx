import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { cn } from '../../lib/cn';

const TONES = {
  info: {
    wrap: 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-100',
    icon: 'text-sky-600 dark:text-sky-300',
    Icon: Info,
  },
  success: {
    wrap: 'border-sage-200 bg-sage-50 text-sage-900 dark:border-sage-900/60 dark:bg-sage-950/30 dark:text-sage-100',
    icon: 'text-sage-600 dark:text-sage-300',
    Icon: CheckCircle2,
  },
  warning: {
    wrap: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100',
    icon: 'text-amber-600 dark:text-amber-300',
    Icon: AlertTriangle,
  },
  error: {
    wrap: 'border-red-200 bg-red-50 text-red-900 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-100',
    icon: 'text-red-600 dark:text-red-300',
    Icon: XCircle,
  },
};

export function Alert({
  tone = 'info',
  title,
  children,
  className,
}: {
  tone?: keyof typeof TONES;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  const config = TONES[tone];
  return (
    <div className={cn('flex items-start gap-3 rounded-2xl border p-3.5', config.wrap, className)}>
      <config.Icon className={cn('mt-0.5 h-4 w-4 shrink-0', config.icon)} />
      <div className="min-w-0 text-sm leading-relaxed">
        {title && <p className="font-semibold">{title}</p>}
        <div className={cn(title && 'mt-0.5', 'opacity-90')}>{children}</div>
      </div>
    </div>
  );
}
