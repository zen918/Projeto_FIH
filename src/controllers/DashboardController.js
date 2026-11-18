const Collection = require('../models/Collection');
const Batch = require('../models/Batch');
const Order = require('../models/Order');
const User = require('../models/User');
const { getSnapshot } = require('../services/impact');

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function index(req, res) {
  const user = res.locals.currentUser;
  const snapshot = getSnapshot(user);
  const isFlorist = user.role === 'floricultura';
  const isClient = user.role === 'comercio_cliente';
  const isAdmin = user.role === 'superadmin';

  const recentCollections = Collection.list({ floristId: isFlorist ? user.id : '', limit: 5 });
  const recentBatches = Batch.list({ floristId: isFlorist ? user.id : '', limit: 5 });
  const recentOrders = isClient || isAdmin || user.role === 'pesquisador_lab' ? Order.list({ clientId: isClient ? user.id : '', limit: 5 }) : [];
  const pendingUsers = isAdmin ? User.list({ status: 'pending' }) : [];
  const lastDelivered = isClient ? Order.list({ clientId: user.id, status: 'entregue', limit: 1 })[0] : null;
  const chartMax = Math.max(
    1,
    ...snapshot.monthly.map((item) => Math.max(item.petalsKg, item.bioplasticKg)),
  );

  return res.render('app/dashboard', {
    layout: 'layouts/main',
    pageTitle: 'Visão geral',
    pageEyebrow: 'Painel de controle',
    activeNav: 'dashboard',
    snapshot,
    greeting: greeting(),
    recentCollections,
    recentBatches,
    recentOrders,
    pendingUsers,
    lastDelivered,
    chartMax,
  });
}

module.exports = { index };
