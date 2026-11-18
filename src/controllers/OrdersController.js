const Order = require('../models/Order');
const Batch = require('../models/Batch');
const {
  ORDER_NEXT,
  ORDER_ACTION_LABELS,
  ORDER_STATUS_OPTIONS,
  PACKAGING_LABELS,
  STATUS_META,
} = require('../config/constants');
const { clean, positiveNumber, oneOf, uuid } = require('../utils/validation');

const MANAGE_ROLES = ['superadmin', 'pesquisador_lab'];

function index(req, res) {
  const user = res.locals.currentUser;
  const isClient = user.role === 'comercio_cliente';
  const status = ORDER_STATUS_OPTIONS.includes(req.query.status) ? req.query.status : '';
  const orders = Order.list({
    clientId: isClient ? user.id : '',
    status,
    limit: 200,
  });
  const summary = Order.summary({ clientId: isClient ? user.id : '' });

  return res.render('app/orders/index', {
    layout: 'layouts/main',
    pageTitle: 'Pedidos B2B',
    pageEyebrow: isClient ? 'Relações comerciais' : 'Gestão de pedidos',
    activeNav: 'orders',
    orders,
    summary,
    status,
    isClient,
  });
}

function showNew(req, res) {
  const batches = Batch.availableForOrder();
  return res.render('app/orders/new', {
    layout: 'layouts/main',
    pageTitle: 'Novo pedido',
    pageEyebrow: 'Solicitação B2B',
    activeNav: 'orders',
    batches,
    packagingOptions: Object.entries(PACKAGING_LABELS),
    form: {
      batchId: batches[0]?.id || '',
      quantityKg: '',
      packagingType: 'sacola',
      notes: '',
    },
  });
}

function create(req, res) {
  const user = res.locals.currentUser;
  const form = {
    batchId: clean(req.body.batchId, 60),
    quantityKg: clean(req.body.quantityKg, 20),
    packagingType: oneOf(req.body.packagingType, Object.keys(PACKAGING_LABELS), 'sacola'),
    notes: clean(req.body.notes, 500),
  };

  const batch = Batch.findById(form.batchId);
  const quantityKg = positiveNumber(form.quantityKg, 5000);
  const errors = [];

  if (!batch) errors.push('Selecione um lote válido.');
  if (!quantityKg) errors.push('Informe uma quantidade válida em kg.');
  if (batch?.status === 'arquivado') errors.push('Este lote está arquivado e não aceita novos pedidos.');

  if (batch && quantityKg) {
    const reserved = Order.reservedKg(batch.id);
    const available = Math.max(0, Math.round((batch.weightProducedKg - reserved) * 1000) / 1000);
    if (quantityKg > available) {
      errors.push(
        available <= 0
          ? 'Este lote não possui mais quantidade disponível.'
          : `Quantidade indisponível. Restam ${available} kg deste lote.`,
      );
    }
  }

  if (errors.length) {
    const batches = Batch.availableForOrder();
    req.flash('danger', errors[0]);
    return res.status(422).render('app/orders/new', {
      layout: 'layouts/main',
      pageTitle: 'Novo pedido',
      pageEyebrow: 'Solicitação B2B',
      activeNav: 'orders',
      batches,
      packagingOptions: Object.entries(PACKAGING_LABELS),
      form,
    });
  }

  const created = Order.create({
    id: uuid(),
    clientId: user.id,
    batchId: batch.id,
    quantityKg,
    packagingType: form.packagingType,
    notes: form.notes,
    createdAt: new Date().toISOString(),
  });

  req.flash(
    'success',
    `Pedido de ${created.quantityKg} kg enviado. A equipe do laboratório vai analisar a disponibilidade.`,
  );
  return res.redirect('/app/pedidos');
}

function updateStatus(req, res) {
  const user = res.locals.currentUser;
  const order = Order.findById(req.params.id);
  if (!order) {
    req.flash('danger', 'Pedido não encontrado.');
    return res.redirect('/app/pedidos');
  }

  const isOwner = order.clientId === user.id;
  const canManage = MANAGE_ROLES.includes(user.role);
  if (!isOwner && !canManage) {
    return res.status(403).render('errors/403', { layout: 'layouts/main', pageTitle: 'Acesso restrito' });
  }

  if (req.body.action === 'cancel') {
    if (['entregue', 'cancelado'].includes(order.status)) {
      req.flash('warning', 'Este pedido já foi encerrado.');
      return res.redirect('/app/pedidos');
    }
    if (!canManage && !(isOwner && ['solicitado', 'em_analise'].includes(order.status))) {
      req.flash('warning', 'Você só pode cancelar pedidos próprios que ainda não entraram em produção.');
      return res.redirect('/app/pedidos');
    }
    Order.updateStatus(order.id, 'cancelado');
    req.flash('success', 'Pedido cancelado e volume liberado no lote.');
    return res.redirect('/app/pedidos');
  }

  if (!canManage) {
    req.flash('danger', 'Somente o laboratório ou o SuperAdmin podem avançar o pedido.');
    return res.redirect('/app/pedidos');
  }

  const next = ORDER_NEXT[order.status];
  if (!next) {
    req.flash('warning', 'Este pedido não possui próxima etapa.');
    return res.redirect('/app/pedidos');
  }

  Order.updateStatus(order.id, next);
  req.flash('success', `Pedido atualizado: ${STATUS_META[next]?.label || next}.`);
  return res.redirect('/app/pedidos');
}

module.exports = { index, showNew, create, updateStatus, ORDER_ACTION_LABELS };
