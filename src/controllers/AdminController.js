const User = require('../models/User');
const { USER_STATUS_OPTIONS } = require('../config/constants');
const { clean } = require('../utils/validation');

function index(req, res) {
  const status = USER_STATUS_OPTIONS.includes(req.query.status) ? req.query.status : '';
  const q = clean(req.query.q, 80);
  const users = User.list({ status, q });
  const counts = User.counts();

  return res.render('app/admin/index', {
    layout: 'layouts/main',
    pageTitle: 'Administração',
    pageEyebrow: 'Governança da plataforma',
    activeNav: 'admin',
    users,
    counts,
    status,
    q,
  });
}

function updateStatus(req, res) {
  const target = User.findById(req.params.id);
  if (!target) {
    req.flash('danger', 'Usuário não encontrado.');
    return res.redirect('/app/admin');
  }

  if (target.id === res.locals.currentUser.id) {
    req.flash('warning', 'Você não pode alterar o status da própria conta.');
    return res.redirect('/app/admin');
  }

  if (target.role === 'superadmin') {
    req.flash('warning', 'Contas SuperAdmin devem ser gerenciadas diretamente no banco.');
    return res.redirect('/app/admin');
  }

  const actions = {
    approve: { status: 'active', message: `Conta de ${target.fullName} aprovada.` },
    block: { status: 'blocked', message: `Conta de ${target.fullName} bloqueada.` },
    reactivate: { status: 'active', message: `Conta de ${target.fullName} reativada.` },
  };

  const action = actions[req.body.action];
  if (!action) {
    req.flash('danger', 'Ação inválida.');
    return res.redirect('/app/admin');
  }

  User.updateStatus(target.id, action.status);
  req.flash('success', action.message);
  return res.redirect('/app/admin');
}

module.exports = { index, updateStatus };
