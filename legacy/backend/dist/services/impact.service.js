"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImpactService = void 0;
const impact_1 = require("../domain/impact");
const repositories_1 = require("../repositories");
const COLLECTED_STATUSES = ['coletada', 'processada'];
const sum = (values) => values.reduce((total, value) => total + value, 0);
function personalMonthlyForClient(orders) {
    const activeOrders = orders.filter((order) => order.status !== 'cancelado');
    return (0, impact_1.buildMonthlyImpact)(activeOrders.map((order) => ({
        createdAt: order.createdAt,
        weightKg: order.quantityKg / impact_1.IMPACT_FACTORS.bioplasticYield,
    })), activeOrders.map((order) => ({
        createdAt: order.createdAt,
        weightProducedKg: order.quantityKg,
    })));
}
class ImpactService {
    async get(user) {
        const [allCollections, allBatches, allOrders, allUsers] = await Promise.all([
            repositories_1.store.listCollections(),
            repositories_1.store.listBatches(),
            repositories_1.store.listOrders(),
            repositories_1.store.listUsers(),
        ]);
        const globalPetals = sum(allCollections
            .filter((collection) => COLLECTED_STATUSES.includes(collection.status))
            .map((collection) => collection.weightKg));
        const globalBioplastic = sum(allBatches.map((batch) => batch.weightProducedKg));
        const global = (0, impact_1.buildImpactMetrics)(globalPetals, globalBioplastic);
        let personal = global;
        let monthly = (0, impact_1.buildMonthlyImpact)(allCollections.filter((collection) => COLLECTED_STATUSES.includes(collection.status)), allBatches);
        if (user.role === 'floricultura') {
            const myCollections = allCollections.filter((collection) => collection.floristId === user.id);
            const myCollectionIds = new Set(myCollections.map((collection) => collection.id));
            const myBatches = allBatches.filter((batch) => myCollectionIds.has(batch.collectionId));
            const myPetals = sum(myCollections
                .filter((collection) => COLLECTED_STATUSES.includes(collection.status))
                .map((collection) => collection.weightKg));
            const myBioplastic = sum(myBatches.map((batch) => batch.weightProducedKg));
            personal = (0, impact_1.buildImpactMetrics)(myPetals, myBioplastic);
            monthly = (0, impact_1.buildMonthlyImpact)(myCollections.filter((collection) => COLLECTED_STATUSES.includes(collection.status)), myBatches);
        }
        if (user.role === 'pesquisador_lab') {
            const myBatches = allBatches.filter((batch) => batch.researcherId === user.id);
            const linkedIds = new Set(myBatches.map((batch) => batch.collectionId));
            const linkedCollections = allCollections.filter((collection) => linkedIds.has(collection.id));
            const myPetals = sum(linkedCollections
                .filter((collection) => COLLECTED_STATUSES.includes(collection.status))
                .map((collection) => collection.weightKg));
            const myBioplastic = sum(myBatches.map((batch) => batch.weightProducedKg));
            personal = (0, impact_1.buildImpactMetrics)(myPetals, myBioplastic);
            monthly = (0, impact_1.buildMonthlyImpact)(linkedCollections.filter((collection) => COLLECTED_STATUSES.includes(collection.status)), myBatches);
        }
        if (user.role === 'comercio_cliente') {
            const myOrders = allOrders.filter((order) => order.clientId === user.id && order.status !== 'cancelado');
            const myBioplastic = sum(myOrders.map((order) => order.quantityKg));
            const equivalentPetals = myBioplastic / impact_1.IMPACT_FACTORS.bioplasticYield;
            personal = (0, impact_1.buildImpactMetrics)(equivalentPetals, myBioplastic);
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
exports.ImpactService = ImpactService;
//# sourceMappingURL=impact.service.js.map