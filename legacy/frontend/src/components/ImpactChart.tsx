import type { MonthlyImpact } from '../types';
import { formatKg } from '../lib/format';
import { cn } from '../lib/cn';

export function ImpactChart({ monthly, className }: { monthly: MonthlyImpact[]; className?: string }) {
  const max = Math.max(
    1,
    ...monthly.flatMap((item) => [item.petalsKg, item.bioplasticKg]),
  );

  if (monthly.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-line text-sm text-muted">
        Ainda não há dados mensais suficientes.
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-t from-petal-600 to-petal-300" />
          Pétalas coletadas
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-t from-sage-700 to-sage-400" />
          Bioplástico produzido
        </span>
      </div>

      <div className="flex h-56 items-end gap-1.5 sm:gap-3">
        {monthly.map((item) => {
          const petalHeight = Math.max(3, (item.petalsKg / max) * 100);
          const bioHeight = Math.max(3, (item.bioplasticKg / max) * 100);
          return (
            <div key={item.month} className="group flex flex-1 flex-col items-center gap-2">
              <div className="flex h-44 w-full items-end justify-center gap-1">
                <div
                  className="w-1/2 max-w-7 rounded-t-xl bg-gradient-to-t from-petal-600 via-petal-400 to-petal-300 opacity-90 transition-all duration-500 group-hover:opacity-100"
                  style={{ height: `${petalHeight}%` }}
                  title={`${item.label}: ${formatKg(item.petalsKg)} de pétalas`}
                />
                <div
                  className="w-1/2 max-w-7 rounded-t-xl bg-gradient-to-t from-sage-800 via-sage-600 to-sage-400 opacity-90 transition-all duration-500 group-hover:opacity-100"
                  style={{ height: `${bioHeight}%` }}
                  title={`${item.label}: ${formatKg(item.bioplasticKg)} de bioplástico`}
                />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
