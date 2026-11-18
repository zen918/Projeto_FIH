const { demoPassword } = require('./env');

const DEMO_ACCOUNTS = [
  { email: 'admin@fih.com', role: 'superadmin', label: 'Equipe FIH', hint: 'Aprovações e visão global' },
  { email: 'floricultura@jau.com', role: 'floricultura', label: 'Floricultura Rosa de Jaú', hint: 'Coletas e impacto local' },
  { email: 'lab@senai.com', role: 'pesquisador_lab', label: 'Laboratório SENAI', hint: 'Lotes, fórmulas e QR Codes' },
  { email: 'cliente@embalagens.com', role: 'comercio_cliente', label: 'EcoEmbalagens B2B', hint: 'Pedidos e selo verde' },
];

module.exports = { DEMO_ACCOUNTS, demoPassword };
