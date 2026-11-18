"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const errors_1 = require("../errors");
const repositories_1 = require("../repositories");
const contracts_1 = require("../repositories/contracts");
class AdminService {
    async listUsers(user) {
        if (user.role !== 'superadmin') {
            throw (0, errors_1.forbidden)('Apenas o SuperAdmin pode gerenciar contas.');
        }
        const users = await repositories_1.store.listUsers();
        return users.map(contracts_1.toProfile);
    }
    async updateUser(user, targetId, input) {
        if (user.role !== 'superadmin') {
            throw (0, errors_1.forbidden)('Apenas o SuperAdmin pode gerenciar contas.');
        }
        const target = await repositories_1.store.findUserById(targetId);
        if (!target)
            throw (0, errors_1.notFound)('Usuário não encontrado.');
        if (target.id === user.id) {
            throw (0, errors_1.conflict)('Você não pode alterar o próprio perfil de acesso.', 'CANNOT_EDIT_SELF');
        }
        const promotingLastAdmin = target.role === 'superadmin' &&
            ((input.role !== undefined && input.role !== 'superadmin') ||
                (input.status !== undefined && input.status !== 'active'));
        if (promotingLastAdmin) {
            const users = await repositories_1.store.listUsers();
            const activeSuperadmins = users.filter((item) => item.role === 'superadmin' && item.status === 'active');
            if (activeSuperadmins.length <= 1) {
                throw (0, errors_1.conflict)('É necessário manter ao menos um SuperAdmin ativo na plataforma.', 'LAST_SUPERADMIN');
            }
        }
        const updated = await repositories_1.store.updateUser(targetId, {
            role: input.role,
            status: input.status,
        });
        if (!updated)
            throw (0, errors_1.notFound)('Usuário não encontrado.');
        return (0, contracts_1.toProfile)(updated);
    }
}
exports.AdminService = AdminService;
//# sourceMappingURL=admin.service.js.map