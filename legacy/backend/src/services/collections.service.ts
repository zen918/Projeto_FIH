import type {
  CollectionStatus,
  PetalCollection,
  Profile,
  QualityStatus,
} from '../domain/types';
import { badRequest, conflict, forbidden, notFound } from '../errors';
import { store } from '../repositories';

export interface CreateCollectionPayload {
  weightKg: number;
  qualityStatus: QualityStatus;
  pickupDate: string;
  notes: string;
  address: string;
}

export interface UpdateCollectionPayload {
  status?: CollectionStatus;
  notes?: string;
  pickupDate?: string;
  weightKg?: number;
  qualityStatus?: QualityStatus;
  address?: string;
}

const TRANSITIONS: Record<CollectionStatus, CollectionStatus[]> = {
  solicitada: ['agendada', 'cancelada'],
  agendada: ['coletada', 'cancelada'],
  coletada: ['processada'],
  processada: [],
  cancelada: [],
};

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export class CollectionsService {
  async list(user: Profile): Promise<PetalCollection[]> {
    if (user.role === 'floricultura') {
      return store.listCollections({ floristId: user.id });
    }
    if (user.role === 'pesquisador_lab' || user.role === 'superadmin') {
      return store.listCollections();
    }
    throw forbidden('Seu perfil não tem acesso ao módulo de coletas.');
  }

  async create(user: Profile, input: CreateCollectionPayload): Promise<PetalCollection> {
    if (user.role !== 'floricultura') {
      throw forbidden('Somente floriculturas podem registrar disponibilidade de pétalas.');
    }
    if (input.pickupDate < todayIsoDate()) {
      throw badRequest('A data limite para coleta não pode estar no passado.');
    }

    return store.createCollection({
      floristId: user.id,
      weightKg: input.weightKg,
      qualityStatus: input.qualityStatus,
      pickupDate: input.pickupDate,
      notes: input.notes.trim(),
      address: input.address.trim(),
    });
  }

  async update(user: Profile, collectionId: string, input: UpdateCollectionPayload): Promise<PetalCollection> {
    const collection = await store.getCollection(collectionId);
    if (!collection) throw notFound('Coleta não encontrada.');

    if (user.role === 'floricultura') {
      if (collection.floristId !== user.id) {
        throw forbidden('Você só pode alterar as suas próprias coletas.');
      }

      if (input.status && input.status !== 'cancelada') {
        throw forbidden('A floricultura pode apenas cancelar a própria solicitação.');
      }
      if (input.status === 'cancelada' && !['solicitada', 'agendada'].includes(collection.status)) {
        throw conflict('Esta coleta não pode mais ser cancelada.');
      }

      const isEditable = ['solicitada', 'agendada'].includes(collection.status);
      const touchesLogistics =
        input.weightKg !== undefined ||
        input.qualityStatus !== undefined ||
        input.address !== undefined ||
        input.pickupDate !== undefined;

      if (touchesLogistics && !isEditable) {
        throw conflict('A coleta já foi realizada e não pode ser editada.');
      }
    } else if (user.role === 'pesquisador_lab' || user.role === 'superadmin') {
      if (input.weightKg !== undefined || input.qualityStatus !== undefined || input.address !== undefined) {
        throw forbidden('Somente a floricultura pode alterar os dados da biomassa.');
      }
      if (input.status && !TRANSITIONS[collection.status].includes(input.status)) {
        throw conflict(
          `Transição inválida: ${collection.status} → ${input.status}.`,
          'INVALID_STATUS_TRANSITION',
        );
      }
    } else {
      throw forbidden('Seu perfil não pode atualizar coletas.');
    }

    const updated = await store.updateCollection(collectionId, {
      ...input,
      notes: input.notes?.trim(),
    });
    if (!updated) throw notFound('Coleta não encontrada.');
    return updated;
  }
}
