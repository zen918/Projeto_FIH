"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectionsRoutes = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const validate_1 = require("../middleware/validate");
const collections_service_1 = require("../services/collections.service");
const service = new collections_service_1.CollectionsService();
exports.collectionsRoutes = (0, express_1.Router)();
exports.collectionsRoutes.use(auth_1.authenticate);
const qualitySchema = zod_1.z.enum(['excelente', 'boa', 'regular', 'critica']);
const statusSchema = zod_1.z.enum(['solicitada', 'agendada', 'coletada', 'processada', 'cancelada']);
const dateSchema = zod_1.z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use uma data no formato AAAA-MM-DD.');
const createSchema = zod_1.z.object({
    weightKg: zod_1.z.coerce.number().positive('Informe um peso maior que zero.').max(5000),
    qualityStatus: qualitySchema,
    pickupDate: dateSchema,
    notes: zod_1.z.string().trim().max(2000).optional().default(''),
    address: zod_1.z.string().trim().min(3, 'Informe o endereço de retirada.').max(240),
});
const updateSchema = zod_1.z
    .object({
    status: statusSchema.optional(),
    notes: zod_1.z.string().trim().max(2000).optional(),
    pickupDate: dateSchema.optional(),
    weightKg: zod_1.z.coerce.number().positive().max(5000).optional(),
    qualityStatus: qualitySchema.optional(),
    address: zod_1.z.string().trim().min(3).max(240).optional(),
})
    .refine((value) => Object.keys(value).length > 0, {
    message: 'Informe ao menos um campo para atualizar.',
});
exports.collectionsRoutes.get('/', (0, validate_1.asyncHandler)(async (req, res) => {
    const collections = await service.list(req.user);
    res.json({ collections });
}));
exports.collectionsRoutes.post('/', (0, rbac_1.requireRole)('floricultura'), (0, validate_1.validateBody)(createSchema), (0, validate_1.asyncHandler)(async (req, res) => {
    const collection = await service.create(req.user, req.body);
    res.status(201).json({ collection });
}));
exports.collectionsRoutes.patch('/:id', (0, validate_1.validateBody)(updateSchema), (0, validate_1.asyncHandler)(async (req, res) => {
    const collection = await service.update(req.user, req.params.id, req.body);
    res.json({ collection });
}));
//# sourceMappingURL=collections.routes.js.map