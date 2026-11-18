const QRCode = require('qrcode');
const Batch = require('../models/Batch');
const { getSnapshot, buildMetrics } = require('../services/impact');
const { isVercel } = require('../config/env');
const { DEMO_ACCOUNTS, demoPassword } = require('../config/demo-accounts');
const { count } = require('../db');
const { clean } = require('../utils/validation');
const { traceUrl } = require('../utils/url');

function home(req, res) {
  const snapshot = getSnapshot(null);
  const examples = Batch.list({ limit: 3 });
  return res.render('public/home', {
    layout: 'layouts/public',
    pageTitle: 'Da pétala à embalagem',
    snapshot,
    examples,
    demoAccounts: DEMO_ACCOUNTS,
    demoPassword,
  });
}

function traceSearch(req, res) {
  const code = clean(req.query.code, 30).toUpperCase();
  if (code) return res.redirect(`/r/${encodeURIComponent(code)}`);
  return res.render('public/trace-search', {
    layout: 'layouts/public',
    pageTitle: 'Rastrear lote',
    examples: Batch.list({ limit: 3 }),
    code: '',
  });
}

function traceShow(req, res, next) {
  const code = String(req.params.code || '').toUpperCase();
  const batch = Batch.findByTraceCode(code);

  if (!batch) {
    return res.status(404).render('public/trace-not-found', {
      layout: 'layouts/public',
      pageTitle: 'Código não encontrado',
      code,
      examples: Batch.list({ limit: 3 }),
    });
  }

  const metrics = buildMetrics(batch.petalsKg, batch.weightProducedKg);
  return QRCode.toDataURL(traceUrl(req, batch.traceCode), {
    width: 640,
    margin: 1,
    color: { dark: '#1c1917', light: '#ffffff' },
  })
    .then((qrDataUrl) => {
      res.render('public/trace', {
        layout: 'layouts/public',
        pageTitle: `Rastreio ${batch.traceCode}`,
        batch,
        metrics,
        qrDataUrl,
        publicTraceUrl: traceUrl(req, batch.traceCode),
      });
    })
    .catch(next);
}

function qrPng(req, res, next) {
  const code = String(req.params.code || '').toUpperCase();
  const batch = Batch.findByTraceCode(code);
  if (!batch) return res.status(404).send('QR Code não encontrado.');

  return QRCode.toBuffer(traceUrl(req, batch.traceCode), {
    type: 'png',
    width: 720,
    margin: 2,
    color: { dark: '#1c1917', light: '#ffffff' },
  })
    .then((buffer) => {
      const disposition = req.query.download === '1' ? 'attachment' : 'inline';
      res.set({
        'Content-Type': 'image/png',
        'Content-Disposition': `${disposition}; filename="pytangy-${batch.traceCode}.png"`,
        'Cache-Control': 'public, max-age=3600',
      });
      res.send(buffer);
    })
    .catch(next);
}

function health(req, res) {
  res.json({
    status: 'ok',
    app: 'Plastikkimik Pytangy MVC',
    mode: isVercel ? 'vercel-ephemeral-sqlite' : 'local-sqlite',
    users: count('SELECT COUNT(*) FROM users'),
    collections: count('SELECT COUNT(*) FROM petal_collections'),
    batches: count('SELECT COUNT(*) FROM bioplastic_batches'),
    orders: count('SELECT COUNT(*) FROM orders'),
    timestamp: new Date().toISOString(),
  });
}

module.exports = { home, traceSearch, traceShow, qrPng, health };
