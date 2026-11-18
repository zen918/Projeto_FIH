import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '../lib/cn';

type ToastTone = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  tone: ToastTone;
  title?: string;
  message: string;
}

interface ToastApi {
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const TONE_STYLES: Record<ToastTone, string> = {
  success: 'border-sage-200 bg-sage-50/95 text-sage-900 dark:border-sage-800 dark:bg-sage-950/95 dark:text-sage-100',
  error: 'border-red-200 bg-red-50/95 text-red-900 dark:border-red-900 dark:bg-red-950/95 dark:text-red-100',
  info: 'border-line bg-surface/95 text-ink',
};

const TONE_ICONS: Record<ToastTone, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
};

const TONE_ICON_STYLES: Record<ToastTone, string> = {
  success: 'text-sage-600 dark:text-sage-300',
  error: 'text-red-600 dark:text-red-300',
  info: 'text-petal-600 dark:text-petal-300',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (tone: ToastTone, message: string, title?: string) => {
      counter.current += 1;
      const id = counter.current;
      setToasts((current) => [...current.slice(-3), { id, tone, message, title }]);
      window.setTimeout(() => remove(id), 4800);
    },
    [remove],
  );

  const toast = useMemo<ToastApi>(
    () => ({
      success: (message, title) => push('success', message, title),
      error: (message, title) => push('error', message, title),
      info: (message, title) => push('info', message, title),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 bottom-24 z-[90] flex flex-col items-center gap-2 md:inset-x-auto md:bottom-6 md:right-6 md:items-end">
        <AnimatePresence initial={false}>
          {toasts.map((item) => {
            const Icon = TONE_ICONS[item.tone];
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className={cn(
                  'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 shadow-soft backdrop-blur-xl',
                  TONE_STYLES[item.tone],
                )}
                role="status"
              >
                <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', TONE_ICON_STYLES[item.tone])} />
                <div className="min-w-0 flex-1">
                  {item.title && <p className="text-sm font-semibold">{item.title}</p>}
                  <p className="text-sm leading-snug opacity-90">{item.message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  className="rounded-full p-1 opacity-60 transition hover:opacity-100"
                  aria-label="Fechar notificação"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast deve ser usado dentro de ToastProvider.');
  return context;
}
