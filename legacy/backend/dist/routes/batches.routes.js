"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchesRoutes = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const validate_1 = require("../middleware/validate");
const batches_service_1 = require("../services/batches.service");
const storage_service_1 = require("../services/storage.service");
const service = new batches_service_1.BatchesService();
const storage = new storage_service_1.StorageService();
exports.batchesRoutes = (0, express_1.Router)();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
});
exports.batchesRoutes.use(auth_1.authenticate);
const createSchema = zod_1.z.object({
    collectionId: zod_1.z.string().uuid('Selecione uma coleta válida.'),
    formulaVersion: zod_1.z.string().trim().min(2, 'Informe a formulação.').max(120),
    weightProducedKg: zod_1.z.coerce.number().positive('Informe o peso produzido.').max(100000),
    biodegradationDays: zod_1.z.coerce
        .number()
        .int('Informe um número inteiro de dias.')
        .positive('Informe o tempo de biodegradação.')
        .max(3650),
    tensileStrength: zod_1.z.coerce
        .number()
        .positive('Informe a resistência à tração.')
        .max(500),
    notes: zod_1.z.string().trim().max(2000).optional().default(''),
});
const updateSchema = zod_1.z
    .object({
    status: zod_1.z.enum(['em_producao', 'concluido', 'arquivado']).optional(),
    notes: zod_1.z.string().trim().max(2000).optional(),
})
    .refine((value) => Object.keys(value).length > 0, {
    message: 'Informe ao menos um campo para atualizar.',
});
exports.batchesRoutes.get('/', (0, validate_1.asyncHandler)(async (req, res) => {
    const batches = await service.list(req.user);
    res.json({ batches });
}));
exports.batchesRoutes.post('/', (0, rbac_1.requireRole)('pesquisador_lab', 'superadmin'), (0, validate_1.validateBody)(createSchema), (0, validate_1.asyncHandler)(async (req, res) => {
    const batch = await service.create(req.user, req.body);
    res.status(201).json({ batch });
}));
exports.batchesRoutes.patch('/:id', (0, rbac_1.requireRole)('pesquisador_lab', 'superadmin'), (0, validate_1.validateBody)(updateSchema), (0, validate_1.asyncHandler)(async (req, res) => {
    const batch = await service.update(req.user, req.params.id, req.body);
    res.json({ batch });
}));
exports.batchesRoutes.post('/:id/evidence', (0, rbac_1.requireRole)('pesquisador_lab', 'superadmin'), upload.single('file'), (0, validate_1.asyncHandler)(async (req, res) => {
    const evidenceUrl = await storage.uploadEvidence(req.params.id, req.file);
    const batch = await service.setEvidence(req.user, req.params.id, evidenceUrl);
    res.json({ batch });
}));
//# sourceMappingURL=batches.routes.js.map