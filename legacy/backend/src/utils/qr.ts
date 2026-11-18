import QRCode from 'qrcode';

export async function generateQrCodePng(content: string): Promise<Buffer> {
  return QRCode.toBuffer(content, {
    type: 'png',
    width: 640,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#1c1917',
      light: '#ffffff',
    },
  });
}

export function buildTraceUrl(traceCode: string, publicAppUrl: string): string {
  return `${publicAppUrl}/r/${traceCode}`;
}
