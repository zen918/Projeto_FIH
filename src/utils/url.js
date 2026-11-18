const { publicAppUrl } = require('../config/env');

function baseUrl(req) {
  if (publicAppUrl) return publicAppUrl;
  return `${req.protocol}://${req.get('host')}`;
}

function traceUrl(req, traceCode) {
  return `${baseUrl(req)}/r/${encodeURIComponent(traceCode)}`;
}

module.exports = { baseUrl, traceUrl };
