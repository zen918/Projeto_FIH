"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollectionsService = void 0;
const errors_1 = require("../errors");
const repositories_1 = require("../repositories");
const TRANSITIONS = {
    solicitada: ['agendada', 'cancelada'],
    agendada: ['coletada', 'cancelada'],
    coletada: ['processada'],
    processada: [],
    cancelada: [],
};
function todayIsoDate() {
    return new Date().toISOString().slice(0, 10);
}
class CollectionsService {
    async list(user) {
        if (user.role === 'floricultura') {
            return repositories_1.store.listCollections({ floristId: user.id });
        }
        if (user.role === 'pesquisador_lab' || user.role === 'superadmin') {
            return repositories_1.store.listCollections();
        }
        throw (0, errors_1.forbidden)('Seu perfil não tem acesso ao módulo de coletas.');
    }
    async create(user, input) {
        if (user.role !== 'floricultura') {
            throw (0, errors_1.forbidden)('Somente floriculturas podem registrar disponibilidade de pétalas.');
        }
        if (input.pickupDate < todayIsoDate()) {
            throw (0, errors_1.badRequest)('A data limite para coleta não pode estar no passado.');
        }
        return repositories_1.store.createCollection({
            floristId: user.id,
            weightKg: input.weightKg,
            qualityStatus: input.qualityStatus,
            pickupDate: input.pickupDate,
            notes: input.notes.trim(),
            address: input.address.trim(),
        });
    }
    async update(user, collectionId, input) {
        const collection = await repositories_1.store.getCollection(collectionId);
        if (!collection)
            throw (0, errors_1.notFound)('Coleta não encontrada.');
        if (user.role === 'floricultura') {
            if (collection.floristId !== user.id) {
                throw (0, errors_1.forbidden)('Você só pode alterar as suas próprias coletas.');
            }
            if (input.status && input.status !== 'cancelada') {
                throw (0, errors_1.forbidden)('A floricultura pode apenas cancelar a própria solicitação.');
            }
            if (input.status === 'cancelada' && !['solicitada', 'agendada'].includes(collection.status)) {
                throw (0, errors_1.conflict)('Esta coleta não pode mais ser cancelada.');
            }
            const isEditable = ['solicitada', 'agendada'].includes(collection.status);
            const touchesLogistics = input.weightKg !== undefined ||
                input.qualityStatus !== undefined ||
                input.address !== undefined ||
                input.pickupDate !== undefined;
            if (touchesLogistics && !isEditable) {
                throw (0, errors_1.conflict)('A coleta já foi realizada e não pode ser editada.');
            }
        }
        else if (user.role === 'pesquisador_lab' || user.role === 'superadmin') {
            if (input.weightKg !== undefined || input.qualityStatus !== undefined || input.address !== undefined) {
                throw (0, errors_1.forbidden)('Somente a floricultura pode alterar os dados da biomassa.');
            }
            if (input.status && !TRANSITIONS[collection.status].includes(input.status)) {
                throw (0, errors_1.conflict)(`Transição inválida: ${collection.status} → ${input.status}.`, 'INVALID_STATUS_TRANSITION');
            }
        }
        else {
            throw (0, errors_1.forbidden)('Seu perfil não pode atualizar coletas.');
        }
        const updated = await repositories_1.store.updateCollection(collectionId, {
            ...input,
            notes: input.notes?.trim(),
        });
        if (!updated)
            throw (0, errors_1.notFound)('Coleta não encontrada.');
        return updated;
    }
}
exports.CollectionsService = CollectionsService;
//# sourceMappingURL=collections.service.js.map