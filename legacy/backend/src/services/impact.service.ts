import {
  IMPACT_FACTORS,
  buildImpactMetrics,
  buildMonthlyImpact,
} from '../domain/impact';
import type {
  BioplasticBatch,
  ImpactResponse,
  MonthlyImpact,
  Order,
  PetalCollection,
  Profile,
} from '../domain/types';
import { store } from '../repositories';

const COLLECTED_STATUSES = ['coletada', 'processada'];
const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

function personalMonthlyForClient(orders: Order[]): MonthlyImpact[] {
  const activeOrders = orders.filter((order) => order.status !== 'cancelado');
  return buildMonthlyImpact(
    activeOrders.map((order) => ({
      createdAt: order.createdAt,
      weightKg: order.quantityKg / IMPACT_FACTORS.bioplasticYield,
    })),
    activeOrders.map((order) => ({
      createdAt: order.createdAt,
      weightProducedKg: order.quantityKg,
    })),
  );
}

export class ImpactService {
  async get(user: Profile): Promise<ImpactResponse> {
    const [allCollections, allBatches, allOrders, allUsers] = await Promise.all([
      store.listCollections(),
      store.listBatches(),
      store.listOrders(),
      store.listUsers(),
    ]);

    const globalPetals = sum(
      allCollections
        .filter((collection) => COLLECTED_STATUSES.includes(collection.status))
        .map((collection) => collection.weightKg),
    );
    const globalBioplastic = sum(allBatches.map((batch) => batch.weightProducedKg));
    const global = buildImpactMetrics(globalPetals, globalBioplastic);

    let personal = global;
    let monthly: MonthlyImpact[] = buildMonthlyImpact(
      allCollections.filter((collection) => COLLECTED_STATUSES.includes(collection.status)),
      allBatches,
    );

    if (user.role === 'floricultura') {
      const myCollections = allCollections.filter((collection) => collection.floristId === user.id);
      const myCollectionIds = new Set(myCollections.map((collection) => collection.id));
      const myBatches = allBatches.filter((batch) => myCollectionIds.has(batch.collectionId));
      const myPetals = sum(
        myCollections
          .filter((collection) => COLLECTED_STATUSES.includes(collection.status))
          .map((collection) => collection.weightKg),
      );
      const myBioplastic = sum(myBatches.map((batch) => batch.weightProducedKg));
      personal = buildImpactMetrics(myPetals, myBioplastic);
      monthly = buildMonthlyImpact(
        myCollections.filter((collection) => COLLECTED_STATUSES.includes(collection.status)),
        myBatches,
      );
    }

    if (user.role === 'pesquisador_lab') {
      const myBatches = allBatches.filter((batch) => batch.researcherId === user.id);
      const linkedIds = new Set(myBatches.map((batch) => batch.collectionId));
      const linkedCollections = allCollections.filter((collection) => linkedIds.has(collection.id));
      const myPetals = sum(
        linkedCollections
          .filter((collection) => COLLECTED_STATUSES.includes(collection.status))
          .map((collection) => collection.weightKg),
      );
      const myBioplastic = sum(myBatches.map((batch) => batch.weightProducedKg));
      personal = buildImpactMetrics(myPetals, myBioplastic);
      monthly = buildMonthlyImpact(
        linkedCollections.filter((collection) => COLLECTED_STATUSES.includes(collection.status)),
        myBatches,
      );
    }

    if (user.role === 'comercio_cliente') {
      const myOrders = allOrders.filter(
        (order) => order.clientId === user.id && order.status !== 'cancelado',
      );
      const myBioplastic = sum(myOrders.map((order) => order.quantityKg));
      const equivalentPetals = myBioplastic / IMPACT_FACTORS.bioplasticYield;
      personal = buildImpactMetrics(equivalentPetals, myBioplastic);
      monthly = personalMonthlyForClient(myOrders);
    }

    const isAdmin = user.role === 'superadmin';

    return {
      global,
      personal,
      monthly,
      counters: {
        collections: allCollections.length,
        batches: allBatches.length,
        orders: allOrders.filter((order) => order.status !== 'cancelado').length,
        users: isAdmin ? allUsers.length : 0,
        pendingUsers: isAdmin ? allUsers.filter((item) => item.status === 'pending').length : 0,
      },
    };
  }
}
