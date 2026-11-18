const { Router } = require('express');
const AuthController = require('../controllers/AuthController');
const PublicController = require('../controllers/PublicController');
const { requireGuest } = require('../middleware/auth');

const router = Router();

router.get('/', PublicController.home);
router.get('/health', PublicController.health);

router.get('/login', requireGuest, AuthController.showLogin);
router.post('/login', requireGuest, AuthController.login);
router.post('/demo-login', requireGuest, AuthController.demoLogin);
router.post('/logout', AuthController.logout);

router.get('/cadastro', requireGuest, AuthController.showSignup);
router.post('/cadastro', requireGuest, AuthController.signup);

router.get('/recuperar-senha', requireGuest, AuthController.showForgot);
router.post('/recuperar-senha', requireGuest, AuthController.forgot);
router.get('/redefinir-senha/:token', AuthController.showReset);
router.post('/redefinir-senha/:token', AuthController.reset);

router.get('/rastreio', PublicController.traceSearch);
router.get('/r/:code/qr.png', PublicController.qrPng);
router.get('/r/:code', PublicController.traceShow);

module.exports = router;
