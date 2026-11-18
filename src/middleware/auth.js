const User = require('../models/User');

function loadUser(req, res, next) {
  res.locals.currentUser = null;
  const userId = req.session?.userId;
  if (!userId) return next();

  const user = User.findById(userId);
  if (!user || user.status !== 'active') {
    req.session = null;
    return next();
  }

  res.locals.currentUser = user;
  res.locals.isClient = user.role === 'comercio_cliente';
  res.locals.canManageCollections = ['superadmin', 'pesquisador_lab'].includes(user.role);
  res.locals.canManageBatches = ['superadmin', 'pesquisador_lab'].includes(user.role);
  res.locals.canManageOrders = ['superadmin', 'pesquisador_lab'].includes(user.role);
  return next();
}

function requireAuth(req, res, next) {
  if (res.locals.currentUser) return next();
  req.flash('warning', 'Entre na sua conta para acessar a plataforma.');
  return res.redirect('/login');
}

function requireGuest(req, res, next) {
  if (!res.locals.currentUser) return next();
  return res.redirect('/app');
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!res.locals.currentUser) {
      req.flash('warning', 'Entre na sua conta para continuar.');
      return res.redirect('/login');
    }
    if (!roles.includes(res.locals.currentUser.role)) {
      return res.status(403).render('errors/403', {
        layout: res.locals.currentUser ? 'layouts/main' : 'layouts/public',
        pageTitle: 'Acesso restrito',
      });
    }
    return next();
  };
}

module.exports = { loadUser, requireAuth, requireGuest, requireRole };
