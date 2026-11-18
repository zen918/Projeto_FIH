"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileService = void 0;
const errors_1 = require("../errors");
const repositories_1 = require("../repositories");
const contracts_1 = require("../repositories/contracts");
const storage_service_1 = require("./storage.service");
class ProfileService {
    storage = new storage_service_1.StorageService();
    async update(user, input) {
        const updated = await repositories_1.store.updateUser(user.id, {
            fullName: input.fullName?.trim(),
            phone: input.phone?.trim(),
            organizationName: input.organizationName?.trim(),
            city: input.city?.trim(),
        });
        if (!updated)
            throw (0, errors_1.notFound)('Perfil não encontrado.');
        return (0, contracts_1.toProfile)(updated);
    }
    async updateAvatar(user, file) {
        const avatarUrl = await this.storage.uploadAvatar(user.id, file);
        const updated = await repositories_1.store.updateUser(user.id, { avatarUrl });
        if (!updated)
            throw (0, errors_1.notFound)('Perfil não encontrado.');
        return (0, contracts_1.toProfile)(updated);
    }
}
exports.ProfileService = ProfileService;
//# sourceMappingURL=profile.service.js.map