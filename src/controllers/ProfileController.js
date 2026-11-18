const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { clean } = require('../utils/validation');

function show(req, res) {
  return res.render('app/profile/index', {
    layout: 'layouts/main',
    pageTitle: 'Meu perfil',
    pageEyebrow: 'Sua conta',
    activeNav: 'profile',
  });
}

function update(req, res) {
  const current = res.locals.currentUser;
  const data = {
    fullName: clean(req.body.fullName, 120),
    organizationName: clean(req.body.organizationName, 160),
    city: clean(req.body.city, 80),
    phone: clean(req.body.phone, 30),
  };

  if (data.fullName.length < 3 || data.organizationName.length < 2 || data.city.length < 2 || data.phone.length < 8) {
    req.flash('danger', 'Revise os dados: nome, organização, cidade e telefone são obrigatórios.');
    return res.redirect('/app/perfil');
  }

  User.updateProfile(current.id, data);
  req.flash('success', 'Dados cadastrais atualizados.');
  return res.redirect('/app/perfil');
}

function updateAvatar(req, res) {
  if (!req.file) {
    req.flash('warning', 'Selecione uma imagem antes de enviar.');
    return res.redirect('/app/perfil');
  }

  const dataUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
  User.updateAvatar(res.locals.currentUser.id, dataUrl);
  req.flash('success', 'Foto de perfil atualizada.');
  return res.redirect('/app/perfil');
}

function removeAvatar(req, res) {
  User.updateAvatar(res.locals.currentUser.id, null);
  req.flash('success', 'Foto de perfil removida.');
  return res.redirect('/app/perfil');
}

function changePassword(req, res) {
  const current = res.locals.currentUser;
  const currentPassword = String(req.body.currentPassword || '');
  const password = String(req.body.password || '');
  const passwordConfirm = String(req.body.passwordConfirm || '');

  if (!bcrypt.compareSync(currentPassword, current.passwordHash)) {
    req.flash('danger', 'A senha atual está incorreta.');
    return res.redirect('/app/perfil');
  }
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    req.flash('danger', 'A nova senha deve ter 8+ caracteres, com letras e números.');
    return res.redirect('/app/perfil');
  }
  if (password !== passwordConfirm) {
    req.flash('danger', 'As novas senhas não conferem.');
    return res.redirect('/app/perfil');
  }

  User.updatePassword(current.id, bcrypt.hashSync(password, 10));
  req.flash('success', 'Senha alterada com sucesso.');
  return res.redirect('/app/perfil');
}

module.exports = { show, update, updateAvatar, removeAvatar, changePassword };
