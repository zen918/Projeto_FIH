const QRCode = require('qrcode');
const Batch = require('../models/Batch');
const Collection = require('../models/Collection');
const Order = require('../models/Order');
const { BATCH_NEXT, BATCH_ACTION_LABELS, STATUS_META } = require('../config/constants');
const { clean, positiveNumber, integerNumber, uuid, traceCode, batchCode } = require('../utils/validation');
const { traceUrl } = require('../utils/url');

function index(req, res) {
  const user = res.locals.currentUser;
  const isFlorist = user.role === 'floricultura';
  const status = ['em_producao', 'concluido', 'arquivado'].includes(req.query.status) ? req.query.status : '';
  const search = clean(req.query.q, 80);
  const batches = Batch.list({
    floristId: isFlorist ? user.id : '',
    status,
    search,
    limit: 200,
  });
  const summary = Batch.summary({ floristId: isFlorist ? user.id : '' });

  return res.render('app/batches/index', {
    layout: 'layouts/main',
    pageTitle: 'Lotes de bioplástico',
    pageEyebrow: 'Catálogo rastreado',
    activeNav: 'batches',
    batches,
    summary,
    status,
    search,
    isFlorist,
  });
}

function showNew(req, res) {
  return res.render('app/batches/new', {
    layout: 'layouts/main',
    pageTitle: 'Novo lote de bioplástico',
    pageEyebrow: 'Produção do laboratório',
    activeNav: 'batches',
    collections: Collection.availableForBatch(),
    form: {
      batchCode: '',
      collectionId: '',
      formulaVersion: 'V3 - Blend flexível',
      weightProducedKg: '',
      biodegradationDays: '35',
      tensileStrength: '',
    },
  });
}

function create(req, res) {
  const user = res.locals.currentUser;
  const form = {
    batchCode: clean(req.body.batchCode, 40).toUpperCase(),
    collectionId: clean(req.body.collectionId, 60),
    formulaVersion: clean(req.body.formulaVersion, 80),
    weightProducedKg: clean(req.body.weightProducedKg, 20),
    biodegradationDays: clean(req.body.biodegradationDays, 10),
    tensileStrength: clean(req.body.tensileStrength, 20),
  };

  const collection = Collection.findById(form.collectionId);
  const weightProducedKg = positiveNumber(form.weightProducedKg, 5000);
  const biodegradationDays = integerNumber(form.biodegradationDays, 1, 365);
  const tensileStrength = form.tensileStrength ? positiveNumber(form.tensileStrength, 500) : null;
  const errors = [];

  if (!collection) errors.push('Selecione uma coleta válida.');
  if (!form.formulaVersion) errors.push('Informe a versão da fórmula.');
  if (!weightProducedKg) errors.push('Informe a quantidade produzida em kg.');
  if (!biodegradationDays) errors.push('Informe o tempo de biodegradação em dias.');
  if (form.tensileStrength && !tensileStrength) errors.push('Resistência mecânica inválida.');
  if (collection && weightProducedKg && weightProducedKg > collection.weightKg) {
    errors.push('A produção não pode ser maior que o peso de pétalas coletado.');
  }
  if (collection && Batch.list({ limit: 1000 }).some((batch) => batch.collectionId === collection.id)) {
    errors.push('Esta coleta já está vinculada a um lote.');
  }

  if (errors.length) {
    req.flash('danger', errors[0]);
    return res.status(422).render('app/batches/new', {
      layout: 'layouts/main',
      pageTitle: 'Novo lote de bioplástico',
      pageEyebrow: 'Produção do laboratório',
      activeNav: 'batches',
      collections: Collection.availableForBatch(),
      form,
    });
  }

  let track = traceCode();
  while (Batch.existsByCode('', track)) track = traceCode();
  let code = form.batchCode || batchCode();
  while (Batch.existsByCode(code, track)) {
    if (form.batchCode) {
      req.flash('danger', 'Já existe um lote com este código. Escolha outro.');
      return res.redirect('/app/lotes/novo');
    }
    code = batchCode();
  }

  const created = Batch.create({
    id: uuid(),
    batchCode: code,
    collectionId: collection.id,
    researcherId: user.id,
    formulaVersion: form.formulaVersion,
    weightProducedKg,
    biodegradationDays,
    tensileStrength,
    traceCode: track,
    createdAt: new Date().toISOString(),
  });

  req.flash('success', `Lote ${created.batchCode} criado com o QR Code ${created.traceCode}.`);
  return res.redirect(`/app/lotes/${created.id}`);
}

function show(req, res, next) {
  const user = res.locals.currentUser;
  const batch = Batch.findById(req.params.id);
  if (!batch) {
    req.flash('danger', 'Lote não encontrado.');
    return res.redirect('/app/lotes');
  }
  if (user.role === 'floricultura' && batch.floristId !== user.id) {
    return res.status(403).render('errors/403', { layout: 'layouts/main', pageTitle: 'Acesso restrito' });
  }

  const orders = Order.list({ batchId: batch.id, limit: 100 });
  const nextStatus = BATCH_NEXT[batch.status];
  const nextLabel = nextStatus ? BATCH_ACTION_LABELS[nextStatus] : null;

  return QRCode.toDataURL(traceUrl(req, batch.traceCode), {
    width: 640,
    margin: 1,
    color: { dark: '#1c1917', light: '#ffffff' },
  })
    .then((qrDataUrl) => {
      res.render('app/batches/show', {
        layout: 'layouts/main',
        pageTitle: batch.batchCode,
        pageEyebrow: 'Rastreabilidade do lote',
        activeNav: 'batches',
        batch,
        orders,
        nextStatus,
        nextLabel,
        qrDataUrl,
        publicTraceUrl: traceUrl(req, batch.traceCode),
      });
    })
    .catch(next);
}

function updateStatus(req, res) {
  const batch = Batch.findById(req.params.id);
  if (!batch) {
    req.flash('danger', 'Lote não encontrado.');
    return res.redirect('/app/lotes');
  }

  const next = BATCH_NEXT[batch.status];
  if (!next) {
    req.flash('warning', 'Este lote não possui próxima etapa.');
    return res.redirect(`/app/lotes/${batch.id}`);
  }
  if (next === 'arquivado' && Batch.activeOrders(batch.id) > 0) {
    req.flash('warning', 'Não é possível arquivar um lote com pedidos ativos.');
    return res.redirect(`/app/lotes/${batch.id}`);
  }

  Batch.updateStatus(batch.id, next);
  req.flash('success', `Lote atualizado para ${STATUS_META[next]?.label || next}.`);
  return res.redirect(`/app/lotes/${batch.id}`);
}

module.exports = { index, showNew, create, show, updateStatus };
