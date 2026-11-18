const Collection = require('../models/Collection');
const Batch = require('../models/Batch');
const Order = require('../models/Order');
const User = require('../models/User');

const FACTORS = {
  bioplasticYield: 0.3,
  fossilPlasticPerKg: 1,
  bagWeightKg: 0.005,
  co2AvoidedPerKg: 3.2,
};

const COLLECTED_STATUSES = ['coletada', 'processada'];
const MONTH_LABELS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

const round1 = (value) => Math.round(value * 10) / 10;
const sum = (values) => values.reduce((total, value) => total + Number(value || 0), 0);

function buildMetrics(petalsKg, bioplasticKg) {
  const petals = Math.max(0, Number(petalsKg || 0));
  const bioplastic = Math.max(0, Number(bioplasticKg || 0));
  return {
    petalsDivertedKg: round1(petals),
    bioplasticProducedKg: round1(bioplastic),
    fossilPlasticAvoidedKg: round1(bioplastic * FACTORS.fossilPlasticPerKg),
    bagsEquivalent: Math.round(bioplastic / FACTORS.bagWeightKg),
    co2AvoidedKg: round1(bioplastic * FACTORS.co2AvoidedPerKg),
    biodegradationDays: null,
  };
}

function buildMonthly(collections, batches, months = 6) {
  const now = new Date();
  const buckets = new Map();

  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    buckets.set(key, {
      month: key,
      label: MONTH_LABELS[date.getMonth()],
      petalsKg: 0,
      bioplasticKg: 0,
    });
  }

  for (const collection of collections) {
    if (!COLLECTED_STATUSES.includes(collection.status)) continue;
    const date = new Date(collection.createdAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const bucket = buckets.get(key);
    if (bucket) bucket.petalsKg = round1(bucket.petalsKg + collection.weightKg);
  }

  for (const batch of batches) {
    const date = new Date(batch.createdAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const bucket = buckets.get(key);
    if (bucket) bucket.bioplasticKg = round1(bucket.bioplasticKg + batch.weightProducedKg);
  }

  return Array.from(buckets.values());
}

function buildClientMonthly(orders, months = 6) {
  const now = new Date();
  const buckets = new Map();

  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    buckets.set(key, {
      month: key,
      label: MONTH_LABELS[date.getMonth()],
      petalsKg: 0,
      bioplasticKg: 0,
    });
  }

  for (const order of orders) {
    const date = new Date(order.createdAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.bioplasticKg = round1(bucket.bioplasticKg + order.quantityKg);
    bucket.petalsKg = round1(bucket.petalsKg + order.quantityKg / FACTORS.bioplasticYield);
  }

  return Array.from(buckets.values());
}

function getSnapshot(user) {
  const collections = Collection.list({ limit: 1000 });
  const batches = Batch.list({ limit: 1000 });
  const orders = Order.list({ limit: 1000 });
  const userCounts = User.counts();
  const deliveredOrders = orders.filter((order) => order.status === 'entregue');
  const activeOrders = orders.filter((order) => !['entregue', 'cancelado'].includes(order.status));

  const globalPetals = sum(
    collections.filter((collection) => COLLECTED_STATUSES.includes(collection.status)).map((collection) => collection.weightKg),
  );
  const globalBioplastic = sum(batches.map((batch) => batch.weightProducedKg));
  const global = buildMetrics(globalPetals, globalBioplastic);

  let personal = global;
  let monthly = buildMonthly(collections, batches);

  if (user?.role === 'floricultura') {
    const myCollections = collections.filter((collection) => collection.floristId === user.id);
    const myCollectionIds = new Set(myCollections.map((collection) => collection.id));
    const myBatches = batches.filter((batch) => myCollectionIds.has(batch.collectionId));
    const petals = sum(
      myCollections.filter((collection) => COLLECTED_STATUSES.includes(collection.status)).map((collection) => collection.weightKg),
    );
    personal = buildMetrics(petals, sum(myBatches.map((batch) => batch.weightProducedKg)));
    monthly = buildMonthly(myCollections, myBatches);
  }

  if (user?.role === 'pesquisador_lab') {
    const myBatches = batches.filter((batch) => batch.researcherId === user.id);
    const linkedIds = new Set(myBatches.map((batch) => batch.collectionId));
    const linkedCollections = collections.filter((collection) => linkedIds.has(collection.id));
    const petals = sum(
      linkedCollections.filter((collection) => COLLECTED_STATUSES.includes(collection.status)).map((collection) => collection.weightKg),
    );
    personal = buildMetrics(petals, sum(myBatches.map((batch) => batch.weightProducedKg)));
    monthly = buildMonthly(linkedCollections, myBatches);
  }

  if (user?.role === 'comercio_cliente') {
    const myOrders = deliveredOrders.filter((order) => order.clientId === user.id);
    const bioplastic = sum(myOrders.map((order) => order.quantityKg));
    personal = buildMetrics(bioplastic / FACTORS.bioplasticYield, bioplastic);
    monthly = buildClientMonthly(myOrders);
  }

  const isAdmin = user?.role === 'superadmin';
  const counters = {
    collections: collections.length,
    batches: batches.length,
    orders: activeOrders.length,
    users: isAdmin ? userCounts.total : 0,
    pendingUsers: isAdmin ? userCounts.pending : 0,
    florists: userCounts.florists,
    clients: userCounts.clients,
  };

  return {
    global,
    personal,
    monthly,
    counters,
    userCounts,
    collections,
    batches,
    orders,
    factorYield: FACTORS.bioplasticYield,
    factors: FACTORS,
  };
}

function personalFor(user) {
  return getSnapshot(user).personal;
}

module.exports = {
  FACTORS,
  getSnapshot,
  personalFor,
  buildMetrics,
  buildMonthly,
  buildClientMonthly,
};
