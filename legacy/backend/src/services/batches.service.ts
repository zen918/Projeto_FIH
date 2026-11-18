import type { BatchStatus, BioplasticBatch, Profile } from '../domain/types';
import { env } from '../config/env';
import { badRequest, conflict, forbidden, notFound } from '../errors';
import { store } from '../repositories';
import { generateBatchCode, generateTraceCode } from '../utils/crypto';
import { buildTraceUrl } from '../utils/qr';

export interface CreateBatchPayload {
  collectionId: string;
  formulaVersion: string;
  weightProducedKg: number;
  biodegradationDays: number;
  tensileStrength: number;
  notes: string;
}

export interface UpdateBatchPayload {
  status?: BatchStatus;
  notes?: string;
}

const TRANSITIONS: Record<BatchStatus, BatchStatus[]> = {
  em_producao: ['concluido', 'arquivado'],
  concluido: ['arquivado'],
  arquivado: [],
};

export class BatchesService {
  async list(user: Profile): Promise<BioplasticBatch[]> {
    if (!user) throw forbidden();
    return store.listBatches();
  }

  async create(user: Profile, input: CreateBatchPayload): Promise<BioplasticBatch> {
    if (user.role !== 'pesquisador_lab' && user.role !== 'superadmin') {
      throw forbidden('Somente o laboratório pode registrar lotes de bioplástico.');
    }

    const collection = await store.getCollection(input.collectionId);
    if (!collection) throw notFound('Coleta de pétalas não encontrada.');
    if (!['coletada', 'processada'].includes(collection.status)) {
      throw conflict('A coleta precisa estar coletada para originar um lote de bioplástico.');
    }

    let traceCode = generateTraceCode();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const existing = await store.getBatchByTraceCode(traceCode);
      if (!existing) break;
      traceCode = generateTraceCode();
    }

    const batch = await store.createBatch({
      batchCode: generateBatchCode(),
      collectionId: collection.id,
      researcherId: user.id,
      formulaVersion: input.formulaVersion.trim(),
      weightProducedKg: input.weightProducedKg,
      biodegradationDays: input.biodegradationDays,
      tensileStrength: input.tensileStrength,
      traceCode,
      qrCodeUrl: buildTraceUrl(traceCode, env.publicAppUrl),
      notes: input.notes.trim(),
      status: 'concluido',
    });

    if (collection.status === 'coletada') {
      await store.updateCollection(collection.id, { status: 'processada' });
    }

    return batch;
  }

  async update(user: Profile, batchId: string, input: UpdateBatchPayload): Promise<BioplasticBatch> {
    if (user.role !== 'pesquisador_lab' && user.role !== 'superadmin') {
      throw forbidden('Somente o laboratório pode atualizar lotes.');
    }

    const batch = await store.getBatch(batchId);
    if (!batch) throw notFound('Lote não encontrado.');

    if (input.status && input.status !== batch.status) {
      if (!TRANSITIONS[batch.status].includes(input.status)) {
        throw conflict(
          `Transição inválida: ${batch.status} → ${input.status}.`,
          'INVALID_STATUS_TRANSITION',
        );
      }
    }

    const updated = await store.updateBatch(batchId, {
      status: input.status,
      notes: input.notes?.trim(),
    });
    if (!updated) throw notFound('Lote não encontrado.');
    return updated;
  }

  async setEvidence(user: Profile, batchId: string, evidenceUrl: string): Promise<BioplasticBatch> {
    if (user.role !== 'pesquisador_lab' && user.role !== 'superadmin') {
      throw forbidden('Somente o laboratório pode anexar evidências de qualidade.');
    }
    const batch = await store.getBatch(batchId);
    if (!batch) throw notFound('Lote não encontrado.');
    const updated = await store.updateBatch(batchId, { evidenceUrl });
    if (!updated) throw notFound('Lote não encontrado.');
    return updated;
  }
}
