import { Loader2 } from 'lucide-react';
import { Logo } from './Logo';

export function FullScreenLoader() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-canvas">
      <Logo />
      <div className="flex items-center gap-2 text-sm text-muted">
        <Loader2 className="h-4 w-4 animate-spin text-sage-600" />
        Carregando sua operação circular…
      </div>
    </div>
  );
}
