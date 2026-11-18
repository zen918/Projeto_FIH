"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const errors_1 = require("../errors");
const repositories_1 = require("../repositories");
const TRANSITIONS = {
    solicitado: ['em_analise', 'aprovado', 'cancelado'],
    em_analise: ['aprovado', 'cancelado'],
    aprovado: ['em_producao', 'cancelado'],
    em_producao: ['entregue', 'cancelado'],
    entregue: [],
    cancelado: [],
};
class OrdersService {
    async list(user) {
        if (user.role === 'comercio_cliente') {
            return repositories_1.store.listOrders({ clientId: user.id });
        }
        if (user.role === 'pesquisador_lab' || user.role === 'superadmin') {
            return repositories_1.store.listOrders();
        }
        throw (0, errors_1.forbidden)('Seu perfil não tem acesso ao módulo de pedidos.');
    }
    async create(user, input) {
        if (user.role !== 'comercio_cliente') {
            throw (0, errors_1.forbidden)('Somente comércios clientes podem realizar pedidos.');
        }
        const batch = await repositories_1.store.getBatch(input.batchId);
        if (!batch)
            throw (0, errors_1.notFound)('Lote de bioplástico não encontrado.');
        if (batch.status === 'arquivado') {
            throw (0, errors_1.conflict)('Este lote está arquivado e não está disponível para pedidos.');
        }
        const allOrders = await repositories_1.store.listOrders();
        const reserved = allOrders
            .filter((order) => order.batchId === batch.id && order.status !== 'cancelado')
            .reduce((total, order) => total + order.quantityKg, 0);
        const available = Math.round((batch.weightProducedKg - reserved) * 1000) / 1000;
        if (input.quantityKg > available) {
            throw (0, errors_1.conflict)(available <= 0
                ? 'Este lote não possui mais quantidade disponível.'
                : `Quantidade indisponível. Restam ${available} kg deste lote.`, 'INSUFFICIENT_STOCK');
        }
        return repositories_1.store.createOrder({
            clientId: user.id,
            batchId: batch.id,
            quantityKg: input.quantityKg,
            packagingType: input.packagingType,
            notes: input.notes.trim(),
        });
    }
    async update(user, orderId, input) {
        const order = await repositories_1.store.getOrder(orderId);
        if (!order)
            throw (0, errors_1.notFound)('Pedido não encontrado.');
        if (user.role === 'comercio_cliente') {
            if (order.clientId !== user.id)
                throw (0, errors_1.forbidden)('Você só pode gerenciar os seus pedidos.');
            if (input.status && input.status !== 'cancelado') {
                throw (0, errors_1.forbidden)('O cliente pode apenas cancelar o próprio pedido.');
            }
            if (input.status === 'cancelado' && !['solicitado', 'em_analise'].includes(order.status)) {
                throw (0, errors_1.conflict)('Este pedido já entrou em produção e não pode mais ser cancelado pelo cliente.');
            }
        }
        else if (user.role === 'pesquisador_lab' || user.role === 'superadmin') {
            if (input.status && input.status !== order.status) {
                if (!TRANSITIONS[order.status].includes(input.status)) {
                    throw (0, errors_1.conflict)(`Transição inválida: ${order.status} → ${input.status}.`, 'INVALID_STATUS_TRANSITION');
                }
            }
        }
        else {
            throw (0, errors_1.forbidden)('Seu perfil não pode atualizar pedidos.');
        }
        const updated = await repositories_1.store.updateOrder(orderId, {
            status: input.status,
            notes: input.notes?.trim(),
        });
        if (!updated)
            throw (0, errors_1.notFound)('Pedido não encontrado.');
        return updated;
    }
}
exports.OrdersService = OrdersService;
//# sourceMappingURL=orders.service.js.map