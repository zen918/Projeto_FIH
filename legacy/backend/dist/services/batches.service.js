"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BatchesService = void 0;
const env_1 = require("../config/env");
const errors_1 = require("../errors");
const repositories_1 = require("../repositories");
const crypto_1 = require("../utils/crypto");
const qr_1 = require("../utils/qr");
const TRANSITIONS = {
    em_producao: ['concluido', 'arquivado'],
    concluido: ['arquivado'],
    arquivado: [],
};
class BatchesService {
    async list(user) {
        if (!user)
            throw (0, errors_1.forbidden)();
        return repositories_1.store.listBatches();
    }
    async create(user, input) {
        if (user.role !== 'pesquisador_lab' && user.role !== 'superadmin') {
            throw (0, errors_1.forbidden)('Somente o laboratório pode registrar lotes de bioplástico.');
        }
        const collection = await repositories_1.store.getCollection(input.collectionId);
        if (!collection)
            throw (0, errors_1.notFound)('Coleta de pétalas não encontrada.');
        if (!['coletada', 'processada'].includes(collection.status)) {
            throw (0, errors_1.conflict)('A coleta precisa estar coletada para originar um lote de bioplástico.');
        }
        let traceCode = (0, crypto_1.generateTraceCode)();
        for (let attempt = 0; attempt < 5; attempt += 1) {
            const existing = await repositories_1.store.getBatchByTraceCode(traceCode);
            if (!existing)
                break;
            traceCode = (0, crypto_1.generateTraceCode)();
        }
        const batch = await repositories_1.store.createBatch({
            batchCode: (0, crypto_1.generateBatchCode)(),
            collectionId: collection.id,
            researcherId: user.id,
            formulaVersion: input.formulaVersion.trim(),
            weightProducedKg: input.weightProducedKg,
            biodegradationDays: input.biodegradationDays,
            tensileStrength: input.tensileStrength,
            traceCode,
            qrCodeUrl: (0, qr_1.buildTraceUrl)(traceCode, env_1.env.publicAppUrl),
            notes: input.notes.trim(),
            status: 'concluido',
        });
        if (collection.status === 'coletada') {
            await repositories_1.store.updateCollection(collection.id, { status: 'processada' });
        }
        return batch;
    }
    async update(user, batchId, input) {
        if (user.role !== 'pesquisador_lab' && user.role !== 'superadmin') {
            throw (0, errors_1.forbidden)('Somente o laboratório pode atualizar lotes.');
        }
        const batch = await repositories_1.store.getBatch(batchId);
        if (!batch)
            throw (0, errors_1.notFound)('Lote não encontrado.');
        if (input.status && input.status !== batch.status) {
            if (!TRANSITIONS[batch.status].includes(input.status)) {
                throw (0, errors_1.conflict)(`Transição inválida: ${batch.status} → ${input.status}.`, 'INVALID_STATUS_TRANSITION');
            }
        }
        const updated = await repositories_1.store.updateBatch(batchId, {
            status: input.status,
            notes: input.notes?.trim(),
        });
        if (!updated)
            throw (0, errors_1.notFound)('Lote não encontrado.');
        return updated;
    }
    async setEvidence(user, batchId, evidenceUrl) {
        if (user.role !== 'pesquisador_lab' && user.role !== 'superadmin') {
            throw (0, errors_1.forbidden)('Somente o laboratório pode anexar evidências de qualidade.');
        }
        const batch = await repositories_1.store.getBatch(batchId);
        if (!batch)
            throw (0, errors_1.notFound)('Lote não encontrado.');
        const updated = await repositories_1.store.updateBatch(batchId, { evidenceUrl });
        if (!updated)
            throw (0, errors_1.notFound)('Lote não encontrado.');
        return updated;
    }
}
exports.BatchesService = BatchesService;
//# sourceMappingURL=batches.service.js.map