const path = require('node:path');
const express = require('express');
const cookieSession = require('cookie-session');
const expressLayouts = require('express-ejs-layouts');
const { sessionSecret, isVercel } = require('./config/env');
const { QUICK_ACTIONS, navFor, isActive } = require('./config/constants');
const { DEMO_ACCOUNTS, demoPassword } = require('./config/demo-accounts');
const helpers = require('./utils/format');
const { loadUser } = require('./middleware/auth');
const { flash } = require('./middleware/flash');
const { baseUrl } = require('./utils/url');
const routes = require('./routes');

const app = express();
const isProduction = isVercel || process.env.NODE_ENV === 'production';

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/public');

app.use(
  '/assets',
  express.static(path.join(__dirname, 'public'), {
    maxAge: isProduction ? '1d' : 0,
    fallthrough: true,
  }),
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  cookieSession({
    name: 'pytangy.demo',
    keys: [sessionSecret],
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax',
    secure: isVercel,
  }),
);
app.use(flash);
app.use(loadUser);

app.use((req, res, next) => {
  Object.assign(res.locals, helpers);
  res.locals.appName = 'Plastikkimik Pytangy';
  res.locals.currentYear = new Date().getFullYear();
  res.locals.currentPath = req.path;
  res.locals.pageTitle = 'Plastikkimik Pytangy';
  res.locals.pageEyebrow = '';
  res.locals.activeNav = '';
  res.locals.bodyClass = '';
  res.locals.navItems = res.locals.currentUser ? navFor(res.locals.currentUser.role) : [];
  res.locals.quickAction = res.locals.currentUser ? QUICK_ACTIONS[res.locals.currentUser.role] : null;
  res.locals.isActive = (to) => isActive(req.path, to);
  res.locals.demoAccounts = DEMO_ACCOUNTS;
  res.locals.demoPassword = demoPassword;
  res.locals.baseUrl = baseUrl(req);
  next();
});

app.use(routes);

app.use((req, res) => {
  res.status(404).render('errors/404', {
    layout: res.locals.currentUser ? 'layouts/main' : 'layouts/public',
    pageTitle: 'Página não encontrada',
  });
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  console.error('[erro]', error);
  return res.status(500).render('errors/500', {
    layout: res.locals.currentUser ? 'layouts/main' : 'layouts/public',
    pageTitle: 'Erro inesperado',
  });
});

module.exports = app;
