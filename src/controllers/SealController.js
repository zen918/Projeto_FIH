const QRCode = require('qrcode');
const Order = require('../models/Order');
const { getSnapshot } = require('../services/impact');
const { traceUrl } = require('../utils/url');

function show(req, res, next) {
  const user = res.locals.currentUser;
  const snapshot = getSnapshot(user);
  const orders = Order.list({ clientId: user.id, limit: 200 });
  const delivered = orders.filter((order) => order.status === 'entregue');
  const highlight = delivered[0] || orders[0] || null;

  const render = (qrDataUrl) =>
    res.render('app/seal/index', {
      layout: 'layouts/main',
      pageTitle: 'Meu selo verde',
      pageEyebrow: 'Sustentabilidade comprovável',
      activeNav: 'seal',
      snapshot,
      orders,
      delivered,
      highlight,
      qrDataUrl,
      publicTraceUrl: highlight ? traceUrl(req, highlight.traceCode) : null,
    });

  if (!highlight) return render(null);

  return QRCode.toDataURL(traceUrl(req, highlight.traceCode), {
    width: 480,
    margin: 1,
    color: { dark: '#1c1917', light: '#ffffff' },
  })
    .then(render)
    .catch(next);
}

module.exports = { show };
