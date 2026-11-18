import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'soft';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

const BASE =
  'focus-ring inline-flex select-none items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-55';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-sage-600 text-white shadow-soft hover:bg-sage-500 hover:shadow-glow dark:bg-sage-600 dark:hover:bg-sage-500',
  secondary: 'bg-petal-500 text-white shadow-soft hover:bg-petal-400',
  outline:
    'border border-line bg-surface text-ink hover:border-sage-300 hover:bg-sage-50 dark:hover:border-sage-700 dark:hover:bg-sage-900/20',
  ghost: 'text-muted hover:bg-line/40 hover:text-ink',
  danger: 'bg-red-600 text-white shadow-soft hover:bg-red-500',
  soft:
    'bg-sage-100 text-sage-800 hover:bg-sage-200 dark:bg-sage-900/50 dark:text-sage-200 dark:hover:bg-sage-900',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-xs',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-sm',
  icon: 'h-10 w-10 p-0',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconRight,
  fullWidth = false,
  className,
  children,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && 'w-full', className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      {children}
      {iconRight && <span className="shrink-0">{iconRight}</span>}
    </button>
  );
}
