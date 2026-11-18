import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Compass, Home, QrCode } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Logo } from '../components/ui/Logo';
import { useAuth } from '../contexts/AuthContext';

export function NotFoundPage() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32 }}
        className="surface-card w-full max-w-lg overflow-hidden"
      >
        <div className="bg-gradient-to-br from-stone-950 via-sage-950 to-stone-900 px-6 py-9 text-white">
          <div className="flex items-center justify-between">
            <Logo tone="light" />
            <span className="font-mono text-3xl font-bold text-white/20">404</span>
          </div>
          <span className="mt-7 grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-petal-300">
            <Compass className="h-7 w-7" />
          </span>
          <h1 className="mt-4 font-display text-3xl leading-tight">Essa página saiu do ciclo.</h1>
          <p className="mt-2 text-sm leading-relaxed text-white/55">
            O endereço que você tentou abrir não existe, mudou de lugar ou não está disponível para
            o seu perfil.
          </p>
        </div>

        <div className="space-y-4 p-6">
          <div className="flex flex-wrap gap-2">
            <Badge tone="sage" dot>
              Navegação segura
            </Badge>
            <Badge tone="zinc">Plataforma Plastikkimik Pytangy</Badge>
          </div>

          <p className="text-sm leading-relaxed text-muted">
            Volte para a visão geral para continuar acompanhando coletas, lotes, pedidos e o
            impacto circular da sua operação. Se você chegou por um QR Code, confira o código de
            rastreio impresso na embalagem.
          </p>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link to={user ? '/app' : '/login'} className="flex-1">
              <Button fullWidth icon={<Home className="h-4 w-4" />}>
                {user ? 'Ir para a visão geral' : 'Ir para o login'}
              </Button>
            </Link>
            <Link to={user ? '/app' : '/login'} className="flex-1">
              <Button fullWidth variant="outline" icon={<ArrowLeft className="h-4 w-4" />}>
                Voltar
              </Button>
            </Link>
          </div>

          <Link
            to="/r/PYTA1B2"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-sage-700 underline-offset-4 hover:underline dark:text-sage-300"
          >
            <QrCode className="h-3.5 w-3.5" />
            Ver exemplo de página pública de rastreio
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
