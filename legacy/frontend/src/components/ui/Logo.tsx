import { Link } from 'react-router-dom';
import { Flower2 } from 'lucide-react';
import { cn } from '../../lib/cn';

export function Logo({
  compact = false,
  tone = 'default',
  to,
  className,
}: {
  compact?: boolean;
  tone?: 'default' | 'light';
  to?: string;
  className?: string;
}) {
  const content = (
    <>
      <span className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-petal-500 via-petal-400 to-sage-500 text-white shadow-glow">
        <Flower2 className="relative h-5 w-5" strokeWidth={1.9} />
        <span className="absolute -bottom-3 -right-3 h-6 w-6 rounded-full bg-white/25 blur-sm" />
      </span>
      {!compact && (
        <span className="leading-none">
          <span
            className={cn(
              'block font-display text-[19px] tracking-tight',
              tone === 'light' ? 'text-white' : 'text-ink',
            )}
          >
            Plastikkimik
          </span>
          <span
            className={cn(
              'mt-1.5 block text-[9px] font-bold uppercase tracking-[0.32em]',
              tone === 'light' ? 'text-white/55' : 'text-muted',
            )}
          >
            Pytangy
          </span>
        </span>
      )}
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        className={cn('flex items-center gap-3', className)}
        aria-label="Plastikkimik Pytangy"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className={cn('flex items-center gap-3', className)} aria-label="Plastikkimik Pytangy">
      {content}
    </div>
  );
}
