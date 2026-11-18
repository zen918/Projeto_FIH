const { Router } = require('express');

const router = Router();

router.use(require('./public.routes'));
router.use('/app', require('./app.routes'));

module.exports = router;
