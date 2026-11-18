const { Router } = require('express');
const DashboardController = require('../controllers/DashboardController');
const CollectionsController = require('../controllers/CollectionsController');
const BatchesController = require('../controllers/BatchesController');
const OrdersController = require('../controllers/OrdersController');
const AdminController = require('../controllers/AdminController');
const ProfileController = require('../controllers/ProfileController');
const SealController = require('../controllers/SealController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { uploadAvatar } = require('../middleware/upload');

const router = Router();

router.use(requireAuth);

router.get('/', DashboardController.index);

router.get('/coletas', requireRole('floricultura', 'pesquisador_lab', 'superadmin'), CollectionsController.index);
router.get('/coletas/nova', requireRole('floricultura'), CollectionsController.showNew);
router.post('/coletas', requireRole('floricultura'), CollectionsController.create);
router.post('/coletas/:id/status', requireRole('floricultura', 'pesquisador_lab', 'superadmin'), CollectionsController.updateStatus);

router.get('/lotes', BatchesController.index);
router.get('/lotes/novo', requireRole('pesquisador_lab', 'superadmin'), BatchesController.showNew);
router.post('/lotes', requireRole('pesquisador_lab', 'superadmin'), BatchesController.create);
router.get('/lotes/:id', BatchesController.show);
router.post('/lotes/:id/status', requireRole('pesquisador_lab', 'superadmin'), BatchesController.updateStatus);

router.get('/pedidos', requireRole('comercio_cliente', 'pesquisador_lab', 'superadmin'), OrdersController.index);
router.get('/pedidos/novo', requireRole('comercio_cliente'), OrdersController.showNew);
router.post('/pedidos', requireRole('comercio_cliente'), OrdersController.create);
router.post('/pedidos/:id/status', requireRole('comercio_cliente', 'pesquisador_lab', 'superadmin'), OrdersController.updateStatus);

router.get('/selo', requireRole('comercio_cliente'), SealController.show);

router.get('/admin', requireRole('superadmin'), AdminController.index);
router.post('/admin/usuarios/:id/status', requireRole('superadmin'), AdminController.updateStatus);

router.get('/perfil', ProfileController.show);
router.post('/perfil', ProfileController.update);
router.post('/perfil/avatar', uploadAvatar, ProfileController.updateAvatar);
router.post('/perfil/avatar/remover', ProfileController.removeAvatar);
router.post('/perfil/senha', ProfileController.changePassword);

module.exports = router;
