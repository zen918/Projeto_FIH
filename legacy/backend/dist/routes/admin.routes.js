"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRoutes = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const validate_1 = require("../middleware/validate");
const admin_service_1 = require("../services/admin.service");
const service = new admin_service_1.AdminService();
exports.adminRoutes = (0, express_1.Router)();
exports.adminRoutes.use(auth_1.authenticate, (0, rbac_1.requireRole)('superadmin'));
const updateSchema = zod_1.z
    .object({
    role: zod_1.z.enum(['superadmin', 'floricultura', 'comercio_cliente', 'pesquisador_lab']).optional(),
    status: zod_1.z.enum(['pending', 'active', 'blocked']).optional(),
})
    .refine((value) => value.role !== undefined || value.status !== undefined, {
    message: 'Informe o perfil ou o status a atualizar.',
});
exports.adminRoutes.get('/users', (0, validate_1.asyncHandler)(async (req, res) => {
    const users = await service.listUsers(req.user);
    res.json({ users });
}));
exports.adminRoutes.patch('/users/:id', (0, validate_1.validateBody)(updateSchema), (0, validate_1.asyncHandler)(async (req, res) => {
    const user = await service.updateUser(req.user, req.params.id, req.body);
    res.json({ user });
}));
//# sourceMappingURL=admin.routes.js.map