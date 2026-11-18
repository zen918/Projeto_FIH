"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PACKAGING_TYPES = exports.ORDER_STATUSES = exports.BATCH_STATUSES = exports.QUALITY_STATUSES = exports.COLLECTION_STATUSES = exports.USER_STATUSES = exports.ROLES = void 0;
exports.ROLES = ['superadmin', 'floricultura', 'comercio_cliente', 'pesquisador_lab'];
exports.USER_STATUSES = ['pending', 'active', 'blocked'];
exports.COLLECTION_STATUSES = ['solicitada', 'agendada', 'coletada', 'processada', 'cancelada'];
exports.QUALITY_STATUSES = ['excelente', 'boa', 'regular', 'critica'];
exports.BATCH_STATUSES = ['em_producao', 'concluido', 'arquivado'];
exports.ORDER_STATUSES = [
    'solicitado',
    'em_analise',
    'aprovado',
    'em_producao',
    'entregue',
    'cancelado',
];
exports.PACKAGING_TYPES = ['sacola', 'filme', 'embalagem_rigida', 'outro'];
//# sourceMappingURL=types.js.map