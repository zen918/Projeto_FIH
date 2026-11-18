"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ordersRoutes = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const validate_1 = require("../middleware/validate");
const orders_service_1 = require("../services/orders.service");
const service = new orders_service_1.OrdersService();
exports.ordersRoutes = (0, express_1.Router)();
exports.ordersRoutes.use(auth_1.authenticate);
const createSchema = zod_1.z.object({
    batchId: zod_1.z.string().uuid('Selecione um lote válido.'),
    quantityKg: zod_1.z.coerce.number().positive('Informe a quantidade desejada.').max(10000),
    packagingType: zod_1.z.enum(['sacola', 'filme', 'embalagem_rigida', 'outro']),
    notes: zod_1.z.string().trim().max(2000).optional().default(''),
});
const updateSchema = zod_1.z
    .object({
    status: zod_1.z
        .enum(['solicitado', 'em_analise', 'aprovado', 'em_producao', 'entregue', 'cancelado'])
        .optional(),
    notes: zod_1.z.string().trim().max(2000).optional(),
})
    .refine((value) => Object.keys(value).length > 0, {
    message: 'Informe ao menos um campo para atualizar.',
});
exports.ordersRoutes.get('/', (0, validate_1.asyncHandler)(async (req, res) => {
    const orders = await service.list(req.user);
    res.json({ orders });
}));
exports.ordersRoutes.post('/', (0, rbac_1.requireRole)('comercio_cliente'), (0, validate_1.validateBody)(createSchema), (0, validate_1.asyncHandler)(async (req, res) => {
    const order = await service.create(req.user, req.body);
    res.status(201).json({ order });
}));
exports.ordersRoutes.patch('/:id', (0, validate_1.validateBody)(updateSchema), (0, validate_1.asyncHandler)(async (req, res) => {
    const order = await service.update(req.user, req.params.id, req.body);
    res.json({ order });
}));
//# sourceMappingURL=orders.routes.js.map