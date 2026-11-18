import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Leaf, LineChart, QrCode, Recycle, Sparkles } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { ThemeToggle } from '../ui/ThemeToggle';

const STATS = [
  { value: '300 g', label: 'bioplástico por kg de pétalas' },
  { value: '26–45', label: 'dias para biodegradar em solo' },
  { value: '100%', label: 'rastreável por QR Code' },
];

const FEATURES = [
  {
    icon: Recycle,
    title: 'Logística reversa inteligente',
    description: 'Floriculturas sinalizam picos de descarte antes da degradação.',
  },
  {
    icon: QrCode,
    title: 'Rastreabilidade da pétala à embalagem',
    description: 'Cada lote tem origem, formulação e impacto verificáveis.',
  },
  {
    icon: LineChart,
    title: 'Impacto ambiental em tempo real',
    description: 'Métricas de plástico fóssil evitado, CO₂ e sacolas substituídas.',
  },
];

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1.08fr_0.92fr]">
      <aside className="relative hidden overflow-hidden bg-stone-950 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 -top-32 h-[30rem] w-[30rem] rounded-full bg-petal-600/30 blur-3xl" />
          <div className="absolute -bottom-40 -right-10 h-[32rem] w-[32rem] rounded-full bg-sage-600/25 blur-3xl" />
          <div className="absolute inset-0 bg-grid opacity-[0.06]" />
          <div className="absolute right-16 top-1/3 h-24 w-24 animate-float rounded-[40%_60%_55%_45%] border border-white/10 bg-white/[0.03] backdrop-blur-sm" />
          <div className="absolute bottom-28 left-14 h-16 w-16 animate-float rounded-[60%_40%_45%_55%] border border-petal-300/20 bg-petal-400/5 [animation-delay:2s]" />
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <Logo tone="light" to="/login" />
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60 backdrop-blur">
            INTEGRA SENAI 2026
          </span>
        </div>

        <div className="relative z-10 mt-14 max-w-xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-white/80">
            <Sparkles className="h-3.5 w-3.5 text-petal-300" />
            Economia circular · Biotecnologia sustentável
          </div>

          <h1 className="text-balance font-display text-4xl leading-[1.05] text-white xl:text-[3.45rem]">
            Da pétala descartada à embalagem que{' '}
            <em className="text-petal-300">volta para a terra.</em>
          </h1>

          <p className="mt-5 max-w-md text-sm leading-relaxed text-white/60">
            O Plastikkimik Pytangy conecta floriculturas, laboratório e comércio B2B em uma cadeia
            rastreável de bioplástico biodegradável feito de pétalas de rosas.
          </p>

          <div className="mt-9 grid grid-cols-3 gap-3">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-sm"
              >
                <p className="font-display text-2xl text-petal-200">{stat.value}</p>
                <p className="mt-1 text-[10px] leading-snug text-white/45">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-9 space-y-4">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-sage-300">
                  <feature.icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white/90">{feature.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-white/45">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 mt-12 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-white/40">
          <span className="inline-flex items-center gap-1.5">
            <Leaf className="h-3.5 w-3.5" /> ODS 12 · 14 · 15
          </span>
          <span>Equipe FIH · Jaú/SP</span>
          <span>Bioplástico de pétalas de rosas</span>
        </div>
      </aside>

      <main className="relative flex min-h-screen flex-col">
        <div className="flex items-center justify-between px-5 pt-5 sm:px-8">
          <Logo to="/login" className="lg:invisible" />
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center px-5 py-8 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md"
          >
            {children}
          </motion.div>
        </div>

        <p className="px-5 pb-6 text-center text-[11px] text-muted">
          Plastikkimik Pytangy · Projeto FIH · Jaú/SP · INTEGRA SENAI 2026
        </p>
      </main>
    </div>
  );
}
