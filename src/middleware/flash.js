function flash(req, res, next) {
  req.flash = (type, message) => {
    if (!req.session) return;
    const list = Array.isArray(req.session.flash) ? req.session.flash : [];
    list.push({ type, message });
    req.session.flash = list;
  };

  res.locals.flash = Array.isArray(req.session?.flash) ? req.session.flash : [];
  if (req.session?.flash) delete req.session.flash;
  next();
}

module.exports = { flash };
