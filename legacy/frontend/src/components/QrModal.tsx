import { useState } from 'react';
import { Check, Copy, ExternalLink, QrCode } from 'lucide-react';
import type { BioplasticBatch } from '../types';
import { apiAssetUrl } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';

export function QrModal({
  batch,
  open,
  onClose,
}: {
  batch: BioplasticBatch | null;
  open: boolean;
  onClose: () => void;
}) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  if (!batch) return null;

  const traceUrl = `${window.location.origin}/r/${batch.traceCode}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(traceUrl);
      setCopied(true);
      toast.success('Link de rastreio copiado.');
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      toast.error('Não foi possível copiar automaticamente. Selecione o link manualmente.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Da pétala à embalagem"
      description={`QR Code público do lote ${batch.batchCode}.`}
      eyebrow="Rastreabilidade circular"
      icon={<QrCode className="h-5 w-5" />}
      size="sm"
      footer={
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={copyLink}
            icon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            className="flex-1"
          >
            {copied ? 'Link copiado' : 'Copiar link'}
          </Button>
          <a
            href={traceUrl}
            target="_blank"
            rel="noreferrer"
            className="focus-ring inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-sage-600 px-5 text-sm font-semibold text-white transition hover:bg-sage-500"
          >
            <ExternalLink className="h-4 w-4" />
            Abrir rastreio
          </a>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="rounded-3xl border border-line bg-white p-4">
          <img
            src={apiAssetUrl(`/public/trace/${batch.traceCode}/qr.png`)}
            alt={`QR Code de rastreabilidade do lote ${batch.batchCode}`}
            className="mx-auto h-56 w-56"
          />
        </div>
        <div className="rounded-2xl border border-line bg-canvas/60 px-4 py-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted">
            Código de rastreio
          </p>
          <p className="mt-1 font-mono text-xl font-bold tracking-[0.22em] text-ink">
            {batch.traceCode}
          </p>
        </div>
        <p className="text-center text-xs leading-relaxed text-muted">
          Ao escanear, qualquer pessoa acessa a origem das pétalas, a formulação do bioplástico e o
          impacto ambiental estimado — sem precisar criar conta.
        </p>
      </div>
    </Modal>
  );
}
