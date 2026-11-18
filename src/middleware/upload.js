const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1.5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      return callback(new Error('Envie uma imagem JPG, PNG ou WebP.'));
    }
    return callback(null, true);
  },
});

function uploadAvatar(req, res, next) {
  upload.single('avatar')(req, res, (error) => {
    if (!error) return next();
    const message =
      error.code === 'LIMIT_FILE_SIZE'
        ? 'A foto deve ter no máximo 1,5 MB.'
        : error.message || 'Não foi possível enviar a foto.';
    req.flash('danger', message);
    return res.redirect('/app/perfil');
  });
}

module.exports = { uploadAvatar };
