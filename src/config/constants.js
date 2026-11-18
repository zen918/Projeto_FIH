const ROLE_LABELS = {
  superadmin: 'SuperAdmin · FIH',
  floricultura: 'Floricultura',
  comercio_cliente: 'Comércio B2B',
  pesquisador_lab: 'Pesquisador · Lab',
};

const ROLE_SHORT_LABELS = {
  superadmin: 'SuperAdmin',
  floricultura: 'Floricultura',
  comercio_cliente: 'Comércio',
  pesquisador_lab: 'Laboratório',
};

const ROLE_DESCRIPTIONS = {
  superadmin: 'Gestão central, aprovação de contas e auditoria de toda a operação.',
  floricultura: 'Registra pétalas disponíveis, agenda coletas e acompanha seu impacto.',
  comercio_cliente: 'Explora o catálogo de bioplástico, faz pedidos e recebe seu selo verde.',
  pesquisador_lab: 'Controla formulações, lotes, QR Codes e evidências de qualidade.',
};

const PACKAGING_LABELS = {
  sacola: 'Sacola biodegradável',
  filme: 'Filme flexível',
  embalagem_rigida: 'Embalagem rígida',
  outro: 'Outro formato',
};

const QUALITY_LABELS = {
  excelente: 'Excelente',
  boa: 'Boa',
  regular: 'Regular',
  critica: 'Crítica',
};

const STATUS_META = {
  pending: { label: 'Em análise', tone: 'warning' },
  active: { label: 'Ativo', tone: 'success' },
  blocked: { label: 'Bloqueado', tone: 'danger' },

  solicitada: { label: 'Solicitada', tone: 'warning' },
  agendada: { label: 'Agendada', tone: 'info' },
  coletada: { label: 'Coletada', tone: 'petal' },
  processada: { label: 'Processada', tone: 'success' },
  cancelada: { label: 'Cancelada', tone: 'muted' },

  em_producao: { label: 'Em produção', tone: 'warning' },
  concluido: { label: 'Concluído', tone: 'success' },
  arquivado: { label: 'Arquivado', tone: 'muted' },

  solicitado: { label: 'Solicitado', tone: 'warning' },
  em_analise: { label: 'Em análise', tone: 'info' },
  aprovado: { label: 'Aprovado', tone: 'success' },
  entregue: { label: 'Entregue', tone: 'success' },
  cancelado: { label: 'Cancelado', tone: 'muted' },

  excelente: { label: 'Excelente', tone: 'success' },
  boa: { label: 'Boa', tone: 'info' },
  regular: { label: 'Regular', tone: 'warning' },
  critica: { label: 'Crítica', tone: 'danger' },
};

const COLLECTION_STATUS_OPTIONS = ['solicitada', 'agendada', 'coletada', 'processada', 'cancelada'];
const ORDER_STATUS_OPTIONS = ['solicitado', 'em_analise', 'aprovado', 'em_producao', 'entregue', 'cancelado'];
const USER_STATUS_OPTIONS = ['pending', 'active', 'blocked'];

const COLLECTION_NEXT = {
  solicitada: 'agendada',
  agendada: 'coletada',
  coletada: 'processada',
};

const ORDER_NEXT = {
  solicitado: 'em_analise',
  em_analise: 'aprovado',
  aprovado: 'em_producao',
  em_producao: 'entregue',
};

const ORDER_ACTION_LABELS = {
  em_analise: 'Iniciar análise',
  aprovado: 'Aprovar pedido',
  em_producao: 'Iniciar produção',
  entregue: 'Confirmar entrega',
};

const BATCH_NEXT = {
  em_producao: 'concluido',
  concluido: 'arquivado',
};

const BATCH_ACTION_LABELS = {
  concluido: 'Concluir lote',
  arquivado: 'Arquivar lote',
};

const NAV_ITEMS = [
  { key: 'dashboard', to: '/app', label: 'Visão geral', shortLabel: 'Início', icon: 'bi-grid-1x2', roles: ['superadmin', 'floricultura', 'pesquisador_lab', 'comercio_cliente'] },
  { key: 'collections', to: '/app/coletas', label: 'Coletas de pétalas', shortLabel: 'Coletas', icon: 'bi-flower1', roles: ['superadmin', 'floricultura', 'pesquisador_lab'] },
  { key: 'batches', to: '/app/lotes', label: 'Lotes de bioplástico', shortLabel: 'Lotes', icon: 'bi-box-seam', roles: ['superadmin', 'floricultura', 'pesquisador_lab', 'comercio_cliente'] },
  { key: 'orders', to: '/app/pedidos', label: 'Pedidos B2B', shortLabel: 'Pedidos', icon: 'bi-bag-check', roles: ['superadmin', 'pesquisador_lab', 'comercio_cliente'] },
  { key: 'seal', to: '/app/selo', label: 'Meu selo verde', shortLabel: 'Selo', icon: 'bi-patch-check', roles: ['comercio_cliente'] },
  { key: 'admin', to: '/app/admin', label: 'Administração', shortLabel: 'Admin', icon: 'bi-shield-check', roles: ['superadmin'] },
  { key: 'profile', to: '/app/perfil', label: 'Meu perfil', shortLabel: 'Perfil', icon: 'bi-person-circle', roles: ['superadmin', 'floricultura', 'pesquisador_lab', 'comercio_cliente'] },
];

const QUICK_ACTIONS = {
  superadmin: { to: '/app/admin?status=pending', label: 'Aprovar' },
  floricultura: { to: '/app/coletas/nova', label: 'Nova coleta' },
  pesquisador_lab: { to: '/app/lotes/novo', label: 'Novo lote' },
  comercio_cliente: { to: '/app/pedidos/novo', label: 'Novo pedido' },
};

const SELF_SERVICE_ROLES = ['floricultura', 'comercio_cliente', 'pesquisador_lab'];

function navFor(role) {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}

function isActive(path, to) {
  if (to === '/app') return path === '/app';
  return path === to || path.startsWith(`${to}/`);
}

module.exports = {
  ROLE_LABELS,
  ROLE_SHORT_LABELS,
  ROLE_DESCRIPTIONS,
  PACKAGING_LABELS,
  QUALITY_LABELS,
  STATUS_META,
  COLLECTION_STATUS_OPTIONS,
  ORDER_STATUS_OPTIONS,
  USER_STATUS_OPTIONS,
  COLLECTION_NEXT,
  ORDER_NEXT,
  ORDER_ACTION_LABELS,
  BATCH_NEXT,
  BATCH_ACTION_LABELS,
  NAV_ITEMS,
  QUICK_ACTIONS,
  SELF_SERVICE_ROLES,
  navFor,
  isActive,
};
