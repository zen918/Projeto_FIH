const bcrypt = require('bcryptjs');
const { autoApproveSignup, demoLogin, demoPassword } = require('../config/env');
const { DEMO_ACCOUNTS } = require('../config/demo-accounts');
const { SELF_SERVICE_ROLES } = require('../config/constants');
const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const { baseUrl } = require('../utils/url');
const { clean, email: parseEmail, oneOf, uuid, token } = require('../utils/validation');

function passwordIsStrong(password) {
  return typeof password === 'string' && password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
}

function showLogin(req, res) {
  if (res.locals.currentUser) return res.redirect('/app');
  return res.render('auth/login', {
    layout: 'layouts/public',
    pageTitle: 'Entrar',
    email: clean(req.query.email, 160),
  });
}

function login(req, res) {
  const email = parseEmail(req.body.email);
  const password = String(req.body.password || '');

  if (!email || !password) {
    req.flash('danger', 'Informe e-mail e senha.');
    return res.redirect('/login');
  }

  const user = User.findByEmail(email);
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    req.flash('danger', 'E-mail ou senha inválidos.');
    return res.redirect('/login');
  }

  if (user.status === 'pending') {
    req.flash('warning', 'Sua conta está em análise pela equipe FIH. Você poderá entrar assim que for aprovada.');
    return res.redirect('/login');
  }

  if (user.status === 'blocked') {
    req.flash('danger', 'Sua conta foi bloqueada. Fale com a equipe FIH para mais informações.');
    return res.redirect('/login');
  }

  req.session.userId = user.id;
  req.flash('success', `Bem-vindo de volta, ${user.fullName.split(' ')[0]}!`);
  return res.redirect('/app');
}

function demoLoginHandler(req, res) {
  if (!demoLogin) {
    req.flash('warning', 'O acesso rápido de demonstração está desativado.');
    return res.redirect('/login');
  }

  const account = DEMO_ACCOUNTS.find((item) => item.email === req.body.email);
  if (!account) {
    req.flash('danger', 'Conta de demonstração inválida.');
    return res.redirect('/login');
  }

  const user = User.findByEmail(account.email);
  if (!user || user.status !== 'active') {
    req.flash('danger', 'Conta de demonstração indisponível.');
    return res.redirect('/login');
  }

  req.session.userId = user.id;
  req.flash('success', `Sessão de demonstração iniciada como ${account.label}.`);
  return res.redirect('/app');
}

function logout(req, res) {
  req.session = null;
  return res.redirect('/login');
}

function showSignup(req, res) {
  if (res.locals.currentUser) return res.redirect('/app');
  return res.render('auth/signup', {
    layout: 'layouts/public',
    pageTitle: 'Criar conta',
    form: {},
  });
}

function signup(req, res) {
  const form = {
    fullName: clean(req.body.fullName, 120),
    email: parseEmail(req.body.email),
    role: oneOf(req.body.role, SELF_SERVICE_ROLES),
    organizationName: clean(req.body.organizationName, 160),
    city: clean(req.body.city, 80),
    phone: clean(req.body.phone, 30),
  };
  const password = String(req.body.password || '');
  const passwordConfirm = String(req.body.passwordConfirm || '');

  const errors = [];
  if (form.fullName.length < 3) errors.push('Informe seu nome completo.');
  if (!form.email) errors.push('Informe um e-mail válido.');
  if (!form.role) errors.push('Selecione um perfil.');
  if (form.organizationName.length < 2) errors.push('Informe a organização.');
  if (form.city.length < 2) errors.push('Informe a cidade.');
  if (form.phone.length < 8) errors.push('Informe um telefone válido.');
  if (!passwordIsStrong(password)) errors.push('A senha deve ter 8+ caracteres, com letras e números.');
  if (password !== passwordConfirm) errors.push('As senhas não conferem.');

  if (!errors.length && User.findByEmail(form.email)) {
    errors.push('Já existe uma conta com este e-mail.');
  }

  if (errors.length) {
    req.flash('danger', errors[0]);
    return res.status(422).render('auth/signup', {
      layout: 'layouts/public',
      pageTitle: 'Criar conta',
      form: { ...form, role: form.role || 'floricultura' },
    });
  }

  const now = new Date().toISOString();
  const status = autoApproveSignup ? 'active' : 'pending';
  const user = User.create({
    id: uuid(),
    fullName: form.fullName,
    email: form.email,
    passwordHash: bcrypt.hashSync(password, 10),
    role: form.role,
    status,
    organizationName: form.organizationName,
    city: form.city,
    phone: form.phone,
    createdAt: now,
    updatedAt: now,
  });

  if (status === 'pending') {
    req.flash('info', 'Conta criada! A equipe FIH vai analisar seu cadastro antes do primeiro acesso.');
    return res.redirect('/login');
  }

  req.session.userId = user.id;
  req.flash('success', 'Conta criada com sucesso. Bem-vindo ao ciclo Plastikkimik Pytangy!');
  return res.redirect('/app');
}

function showForgot(req, res) {
  if (res.locals.currentUser) return res.redirect('/app');
  return res.render('auth/forgot-password', {
    layout: 'layouts/public',
    pageTitle: 'Recuperar senha',
    resetLink: null,
  });
}

function forgot(req, res) {
  const email = parseEmail(req.body.email);
  if (!email) {
    req.flash('danger', 'Informe um e-mail válido.');
    return res.redirect('/recuperar-senha');
  }

  const user = User.findByEmail(email);
  let resetLink = null;

  if (user) {
    PasswordReset.deleteForUser(user.id);
    const resetToken = token(24);
    PasswordReset.create({
      id: uuid(),
      userId: user.id,
      token: resetToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    });
    resetLink = `${baseUrl(req)}/redefinir-senha/${resetToken}`;
  }

  return res.render('auth/forgot-password', {
    layout: 'layouts/public',
    pageTitle: 'Recuperar senha',
    resetLink,
    email,
  });
}

function showReset(req, res) {
  const reset = PasswordReset.findValid(req.params.token);
  if (!reset) {
    req.flash('danger', 'Este link de redefinição é inválido ou expirou. Solicite um novo.');
    return res.redirect('/recuperar-senha');
  }
  return res.render('auth/reset-password', {
    layout: 'layouts/public',
    pageTitle: 'Definir nova senha',
    token: req.params.token,
  });
}

function reset(req, res) {
  const resetRecord = PasswordReset.findValid(req.params.token);
  if (!resetRecord) {
    req.flash('danger', 'Este link de redefinição é inválido ou expirou. Solicite um novo.');
    return res.redirect('/recuperar-senha');
  }

  const password = String(req.body.password || '');
  const passwordConfirm = String(req.body.passwordConfirm || '');

  if (!passwordIsStrong(password)) {
    req.flash('danger', 'A senha deve ter 8+ caracteres, com letras e números.');
    return res.redirect(`/redefinir-senha/${req.params.token}`);
  }
  if (password !== passwordConfirm) {
    req.flash('danger', 'As senhas não conferem.');
    return res.redirect(`/redefinir-senha/${req.params.token}`);
  }

  User.updatePassword(resetRecord.user_id, bcrypt.hashSync(password, 10));
  PasswordReset.markUsed(resetRecord.id);
  req.flash('success', 'Senha atualizada. Entre com a nova senha.');
  return res.redirect('/login');
}

module.exports = {
  showLogin,
  login,
  demoLogin: demoLoginHandler,
  logout,
  showSignup,
  signup,
  showForgot,
  forgot,
  showReset,
  reset,
  demoPassword,
  DEMO_ACCOUNTS,
};
