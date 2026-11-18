const Collection = require('../models/Collection');
const { COLLECTION_NEXT, COLLECTION_STATUS_OPTIONS, QUALITY_LABELS } = require('../config/constants');
const { clean, positiveNumber, isoDate, oneOf, uuid } = require('../utils/validation');

const MANAGE_ROLES = ['superadmin', 'pesquisador_lab'];

function index(req, res) {
  const user = res.locals.currentUser;
  const isFlorist = user.role === 'floricultura';
  const status = COLLECTION_STATUS_OPTIONS.includes(req.query.status) ? req.query.status : '';
  const collections = Collection.list({
    floristId: isFlorist ? user.id : '',
    status,
    limit: 200,
  });
  const summary = Collection.summary({ floristId: isFlorist ? user.id : '' });

  return res.render('app/collections/index', {
    layout: 'layouts/main',
    pageTitle: 'Coletas de pétalas',
    pageEyebrow: 'Logística reversa',
    activeNav: 'collections',
    collections,
    summary,
    status,
    isFlorist,
  });
}

function showNew(req, res) {
  return res.render('app/collections/new', {
    layout: 'layouts/main',
    pageTitle: 'Registrar coleta',
    pageEyebrow: 'Nova sinalização',
    activeNav: 'collections',
    qualityOptions: Object.entries(QUALITY_LABELS),
    form: {
      weightKg: '',
      qualityStatus: 'boa',
      pickupDate: '',
      address: `${res.locals.currentUser.organizationName} · ${res.locals.currentUser.city}`,
      notes: '',
    },
  });
}

function create(req, res) {
  const user = res.locals.currentUser;
  const form = {
    weightKg: clean(req.body.weightKg, 20),
    qualityStatus: oneOf(req.body.qualityStatus, Object.keys(QUALITY_LABELS), 'boa'),
    pickupDate: clean(req.body.pickupDate, 10),
    address: clean(req.body.address, 200),
    notes: clean(req.body.notes, 500),
  };

  const weightKg = positiveNumber(form.weightKg, 5000);
  const pickupDate = isoDate(form.pickupDate);
  const errors = [];
  if (!weightKg) errors.push('Informe uma quantidade válida de pétalas (em kg).');
  if (!pickupDate) errors.push('Informe uma data válida para a retirada.');
  if (form.address.length < 5) errors.push('Informe o endereço de retirada.');

  if (errors.length) {
    req.flash('danger', errors[0]);
    return res.status(422).render('app/collections/new', {
      layout: 'layouts/main',
      pageTitle: 'Registrar coleta',
      pageEyebrow: 'Nova sinalização',
      activeNav: 'collections',
      qualityOptions: Object.entries(QUALITY_LABELS),
      form,
    });
  }

  const created = Collection.create({
    id: uuid(),
    floristId: user.id,
    weightKg,
    qualityStatus: form.qualityStatus,
    pickupDate,
    address: form.address,
    notes: form.notes,
    createdAt: new Date().toISOString(),
  });

  req.flash('success', `Coleta de ${created.weightKg} kg registrada. A equipe do laboratório fará o agendamento.`);
  return res.redirect('/app/coletas');
}

function updateStatus(req, res) {
  const user = res.locals.currentUser;
  const collection = Collection.findById(req.params.id);
  if (!collection) {
    req.flash('danger', 'Coleta não encontrada.');
    return res.redirect('/app/coletas');
  }

  const isOwner = collection.floristId === user.id;
  const canManage = MANAGE_ROLES.includes(user.role);
  if (!isOwner && !canManage) {
    return res.status(403).render('errors/403', {
      layout: 'layouts/main',
      pageTitle: 'Acesso restrito',
    });
  }

  if (req.body.action === 'cancel') {
    if (['processada', 'cancelada'].includes(collection.status)) {
      req.flash('warning', 'Esta coleta já foi processada e não pode ser cancelada.');
      return res.redirect('/app/coletas');
    }
    if (!canManage && !isOwner) {
      return res.status(403).render('errors/403', { layout: 'layouts/main', pageTitle: 'Acesso restrito' });
    }
    Collection.updateStatus(collection.id, 'cancelada');
    req.flash('success', 'Coleta cancelada. A biomassa não será contabilizada no impacto.');
    return res.redirect('/app/coletas');
  }

  if (!canManage) {
    req.flash('danger', 'Somente o laboratório ou o SuperAdmin podem avançar o status da coleta.');
    return res.redirect('/app/coletas');
  }

  const next = COLLECTION_NEXT[collection.status];
  if (!next) {
    req.flash('warning', 'Esta coleta não possui próxima etapa.');
    return res.redirect('/app/coletas');
  }

  Collection.updateStatus(collection.id, next);
  req.flash('success', `Coleta atualizada para ${next.replace('_', ' ')}.`);
  return res.redirect('/app/coletas');
}

module.exports = { index, showNew, create, updateStatus };
