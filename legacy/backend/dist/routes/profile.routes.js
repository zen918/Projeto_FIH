"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileRoutes = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const profile_service_1 = require("../services/profile.service");
const service = new profile_service_1.ProfileService();
exports.profileRoutes = (0, express_1.Router)();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 },
});
exports.profileRoutes.use(auth_1.authenticate);
const updateSchema = zod_1.z
    .object({
    fullName: zod_1.z.string().trim().min(3, 'Informe seu nome completo.').max(120).optional(),
    phone: zod_1.z.string().trim().min(8, 'Informe um telefone válido.').max(30).optional(),
    organizationName: zod_1.z.string().trim().min(2, 'Informe a organização.').max(160).optional(),
    city: zod_1.z.string().trim().min(2, 'Informe a cidade.').max(80).optional(),
})
    .refine((value) => Object.keys(value).length > 0, {
    message: 'Informe ao menos um campo para atualizar.',
});
exports.profileRoutes.get('/', (req, res) => {
    res.json({ user: req.user });
});
exports.profileRoutes.patch('/', (0, validate_1.validateBody)(updateSchema), (0, validate_1.asyncHandler)(async (req, res) => {
    const user = await service.update(req.user, req.body);
    res.json({ user });
}));
exports.profileRoutes.post('/avatar', upload.single('file'), (0, validate_1.asyncHandler)(async (req, res) => {
    const user = await service.updateAvatar(req.user, req.file);
    res.json({ user });
}));
//# sourceMappingURL=profile.routes.js.map