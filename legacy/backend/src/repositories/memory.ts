import crypto from 'node:crypto';
import type {
  BioplasticBatch,
  Order,
  PetalCollection,
  Profile,
  UserRecord,
} from '../domain/types';
import { hashPassword } from '../utils/crypto';
import type {
  CreateBatchInput,
  CreateCollectionInput,
  CreateOrderInput,
  CreateUserInput,
  Store,
  UpdateBatchPatch,
  UpdateCollectionPatch,
  UpdateOrderPatch,
  UpdateUserPatch,
} from './contracts';

const USER_ADMIN = '00000000-0000-4000-8000-000000000001';
const USER_FLORIST = '00000000-0000-4000-8000-000000000002';
const USER_LAB = '00000000-0000-4000-8000-000000000003';
const USER_CLIENT = '00000000-0000-4000-8000-000000000004';
const USER_FLORIST_2 = '00000000-0000-4000-8000-000000000005';
const USER_PENDING = '00000000-0000-4000-8000-000000000006';
const USER_CLIENT_2 = '00000000-0000-4000-8000-000000000007';

const COLLECTION_IDS = [
  '00000000-0000-4000-8000-000000000101',
  '00000000-0000-4000-8000-000000000102',
  '00000000-0000-4000-8000-000000000103',
  '00000000-0000-4000-8000-000000000104',
  '00000000-0000-4000-8000-000000000105',
  '00000000-0000-4000-8000-000000000106',
  '00000000-0000-4000-8000-000000000107',
  '00000000-0000-4000-8000-000000000108',
  '00000000-0000-4000-8000-000000000109',
];

const BATCH_IDS = [
  '00000000-0000-4000-8000-000000000201',
  '00000000-0000-4000-8000-000000000202',
  '00000000-0000-4000-8000-000000000203',
  '00000000-0000-4000-8000-000000000204',
  '00000000-0000-4000-8000-000000000205',
  '00000000-0000-4000-8000-000000000206',
];

const ORDER_IDS = [
  '00000000-0000-4000-8000-000000000301',
  '00000000-0000-4000-8000-000000000302',
  '00000000-0000-4000-8000-000000000303',
  '00000000-0000-4000-8000-000000000304',
  '00000000-0000-4000-8000-000000000305',
  '00000000-0000-4000-8000-000000000306',
  '00000000-0000-4000-8000-000000000307',
  '00000000-0000-4000-8000-000000000308',
  '00000000-0000-4000-8000-000000000309',
];

function isoDaysAgo(days: number, hour = 10): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

function isoDaysAhead(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(12, 0, 0, 0);
  return date.toISOString();
}

function dateOnly(daysAhead: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date.toISOString().slice(0, 10);
}

function ensureFound<T>(value: T | null | undefined, label: string): T {
  if (!value) throw new Error(`${label} não encontrado.`);
  return value;
}

export function createMemoryStore(): Store {
  const demoPasswordHash = hashPassword('Demo@1234');

  const users: UserRecord[] = [
    {
      id: USER_ADMIN,
      fullName: 'Equipe FIH',
      email: 'admin@fih.com',
      passwordHash: demoPasswordHash,
      role: 'superadmin',
      status: 'active',
      avatarUrl: null,
      organizationName: 'Equipe FIH · SENAI Jaú',
      city: 'Jaú',
      phone: '(14) 99999-0001',
      createdAt: isoDaysAgo(210),
      updatedAt: isoDaysAgo(210),
    },
    {
      id: USER_FLORIST,
      fullName: 'Marina Rosa',
      email: 'floricultura@jau.com',
      passwordHash: demoPasswordHash,
      role: 'floricultura',
      status: 'active',
      avatarUrl: null,
      organizationName: 'Floricultura Rosa de Jaú',
      city: 'Jaú',
      phone: '(14) 98888-1002',
      createdAt: isoDaysAgo(190),
      updatedAt: isoDaysAgo(190),
    },
    {
      id: USER_LAB,
      fullName: 'Prof. Ana Beatriz',
      email: 'lab@senai.com',
      passwordHash: demoPasswordHash,
      role: 'pesquisador_lab',
      status: 'active',
      avatarUrl: null,
      organizationName: 'Laboratório de Biotecnologia SENAI',
      city: 'Jaú',
      phone: '(14) 97777-2003',
      createdAt: isoDaysAgo(188),
      updatedAt: isoDaysAgo(188),
    },
    {
      id: USER_CLIENT,
      fullName: 'Rafael Verde',
      email: 'cliente@embalagens.com',
      passwordHash: demoPasswordHash,
      role: 'comercio_cliente',
      status: 'active',
      avatarUrl: null,
      organizationName: 'EcoEmbalagens B2B',
      city: 'Bauru',
      phone: '(14) 96666-3004',
      createdAt: isoDaysAgo(170),
      updatedAt: isoDaysAgo(170),
    },
    {
      id: USER_FLORIST_2,
      fullName: 'Carlos Jardim',
      email: 'floricultura2@jau.com',
      passwordHash: demoPasswordHash,
      role: 'floricultura',
      status: 'active',
      avatarUrl: null,
      organizationName: 'Jardim das Acácias',
      city: 'Jaú',
      phone: '(14) 95555-4005',
      createdAt: isoDaysAgo(120),
      updatedAt: isoDaysAgo(120),
    },
    {
      id: USER_PENDING,
      fullName: 'Lucia Prado',
      email: 'contato@florlux.com',
      passwordHash: demoPasswordHash,
      role: 'floricultura',
      status: 'pending',
      avatarUrl: null,
      organizationName: 'Florlux Distribuidora',
      city: 'Bariri',
      phone: '(14) 94444-5006',
      createdAt: isoDaysAgo(2),
      updatedAt: isoDaysAgo(2),
    },
    {
      id: USER_CLIENT_2,
      fullName: 'Camila Nobre',
      email: 'compras@verde.com',
      passwordHash: demoPasswordHash,
      role: 'comercio_cliente',
      status: 'active',
      avatarUrl: null,
      organizationName: 'Verde Vivo Embalagens',
      city: 'Pederneiras',
      phone: '(14) 93333-6007',
      createdAt: isoDaysAgo(90),
      updatedAt: isoDaysAgo(90),
    },
  ];

  const byId = (id: string) => users.find((user) => user.id === id);

  const collections: PetalCollection[] = [
    {
      id: COLLECTION_IDS[0],
      floristId: USER_FLORIST,
      floristName: 'Marina Rosa',
      floristOrganization: 'Floricultura Rosa de Jaú',
      floristCity: 'Jaú',
      weightKg: 18,
      qualityStatus: 'excelente',
      pickupDate: isoDaysAgo(147),
      status: 'processada',
      notes: 'Pétalas de rosas vermelhas e cor-de-rosa, pós-evento.',
      address: 'Rua das Rosas, 120 · Jaú/SP',
      createdAt: isoDaysAgo(150),
      updatedAt: isoDaysAgo(145),
    },
    {
      id: COLLECTION_IDS[1],
      floristId: USER_FLORIST_2,
      floristName: 'Carlos Jardim',
      floristOrganization: 'Jardim das Acácias',
      floristCity: 'Jaú',
      weightKg: 22,
      qualityStatus: 'boa',
      pickupDate: isoDaysAgo(122),
      status: 'processada',
      notes: 'Descarte semanal de rosas brancas.',
      address: 'Av. das Acácias, 46 · Jaú/SP',
      createdAt: isoDaysAgo(125),
      updatedAt: isoDaysAgo(120),
    },
    {
      id: COLLECTION_IDS[2],
      floristId: USER_FLORIST,
      floristName: 'Marina Rosa',
      floristOrganization: 'Floricultura Rosa de Jaú',
      floristCity: 'Jaú',
      weightKg: 15.5,
      qualityStatus: 'boa',
      pickupDate: isoDaysAgo(97),
      status: 'processada',
      notes: 'Pétalas preservadas em câmara fria.',
      address: 'Rua das Rosas, 120 · Jaú/SP',
      createdAt: isoDaysAgo(100),
      updatedAt: isoDaysAgo(95),
    },
    {
      id: COLLECTION_IDS[3],
      floristId: USER_FLORIST,
      floristName: 'Marina Rosa',
      floristOrganization: 'Floricultura Rosa de Jaú',
      floristCity: 'Jaú',
      weightKg: 24,
      qualityStatus: 'excelente',
      pickupDate: isoDaysAgo(69),
      status: 'processada',
      notes: 'Pico pós-Dia das Mães.',
      address: 'Rua das Rosas, 120 · Jaú/SP',
      createdAt: isoDaysAgo(72),
      updatedAt: isoDaysAgo(67),
    },
    {
      id: COLLECTION_IDS[4],
      floristId: USER_FLORIST_2,
      floristName: 'Carlos Jardim',
      floristOrganization: 'Jardim das Acácias',
      floristCity: 'Jaú',
      weightKg: 12,
      qualityStatus: 'regular',
      pickupDate: isoDaysAgo(45),
      status: 'processada',
      notes: 'Separação manual necessária.',
      address: 'Av. das Acácias, 46 · Jaú/SP',
      createdAt: isoDaysAgo(48),
      updatedAt: isoDaysAgo(43),
    },
    {
      id: COLLECTION_IDS[5],
      floristId: USER_FLORIST,
      floristName: 'Marina Rosa',
      floristOrganization: 'Floricultura Rosa de Jaú',
      floristCity: 'Jaú',
      weightKg: 20,
      qualityStatus: 'excelente',
      pickupDate: isoDaysAgo(22),
      status: 'processada',
      notes: 'Pétalas processadas no lote experimental V4.',
      address: 'Rua das Rosas, 120 · Jaú/SP',
      createdAt: isoDaysAgo(25),
      updatedAt: isoDaysAgo(20),
    },
    {
      id: COLLECTION_IDS[6],
      floristId: USER_FLORIST_2,
      floristName: 'Carlos Jardim',
      floristOrganization: 'Jardim das Acácias',
      floristCity: 'Jaú',
      weightKg: 16,
      qualityStatus: 'boa',
      pickupDate: isoDaysAgo(3),
      status: 'coletada',
      notes: 'Disponível para o próximo lote do laboratório.',
      address: 'Av. das Acácias, 46 · Jaú/SP',
      createdAt: isoDaysAgo(10),
      updatedAt: isoDaysAgo(3),
    },
    {
      id: COLLECTION_IDS[7],
      floristId: USER_FLORIST,
      floristName: 'Marina Rosa',
      floristOrganization: 'Floricultura Rosa de Jaú',
      floristCity: 'Jaú',
      weightKg: 9.5,
      qualityStatus: 'boa',
      pickupDate: dateOnly(2),
      status: 'agendada',
      notes: 'Coleta agendada para a próxima quinta-feira.',
      address: 'Rua das Rosas, 120 · Jaú/SP',
      createdAt: isoDaysAgo(4),
      updatedAt: isoDaysAgo(2),
    },
    {
      id: COLLECTION_IDS[8],
      floristId: USER_FLORIST,
      floristName: 'Marina Rosa',
      floristOrganization: 'Floricultura Rosa de Jaú',
      floristCity: 'Jaú',
      weightKg: 11.5,
      qualityStatus: 'excelente',
      pickupDate: dateOnly(5),
      status: 'solicitada',
      notes: 'Solicitação criada pelo aplicativo após evento.',
      address: 'Rua das Rosas, 120 · Jaú/SP',
      createdAt: isoDaysAgo(1),
      updatedAt: isoDaysAgo(1),
    },
  ];

  const batchOrigin = (collectionId: string) => {
    const collection = collections.find((item) => item.id === collectionId);
    if (!collection) return null;
    return {
      collectionId: collection.id,
      floristId: collection.floristId,
      floristName: collection.floristName,
      floristOrganization: collection.floristOrganization,
      floristCity: collection.floristCity,
      petalWeightKg: collection.weightKg,
      qualityStatus: collection.qualityStatus,
      pickupDate: collection.pickupDate,
    };
  };

  const batches: BioplasticBatch[] = [
    {
      id: BATCH_IDS[0],
      batchCode: 'LOTE-260301-A1B2',
      collectionId: COLLECTION_IDS[0],
      researcherId: USER_LAB,
      researcherName: 'Prof. Ana Beatriz',
      researcherOrganization: 'Laboratório de Biotecnologia SENAI',
      formulaVersion: 'V1 · Amido + glicerol',
      weightProducedKg: 5.2,
      biodegradationDays: 45,
      tensileStrength: 11.8,
      traceCode: 'PYTA1B2',
      qrCodeUrl: 'http://localhost:5173/r/PYTA1B2',
      evidenceUrl: null,
      status: 'concluido',
      notes: 'Primeira formulação estável do MVP.',
      createdAt: isoDaysAgo(144),
      updatedAt: isoDaysAgo(140),
      origin: batchOrigin(COLLECTION_IDS[0]),
    },
    {
      id: BATCH_IDS[1],
      batchCode: 'LOTE-260401-C3D4',
      collectionId: COLLECTION_IDS[1],
      researcherId: USER_LAB,
      researcherName: 'Prof. Ana Beatriz',
      researcherOrganization: 'Laboratório de Biotecnologia SENAI',
      formulaVersion: 'V2 · Pétalas + quitosana',
      weightProducedKg: 6.8,
      biodegradationDays: 38,
      tensileStrength: 13.4,
      traceCode: 'PYTC3D4',
      qrCodeUrl: 'http://localhost:5173/r/PYTC3D4',
      evidenceUrl: null,
      status: 'concluido',
      notes: 'Melhor resistência à tração da série.',
      createdAt: isoDaysAgo(118),
      updatedAt: isoDaysAgo(112),
      origin: batchOrigin(COLLECTION_IDS[1]),
    },
    {
      id: BATCH_IDS[2],
      batchCode: 'LOTE-260501-E5F6',
      collectionId: COLLECTION_IDS[2],
      researcherId: USER_LAB,
      researcherName: 'Prof. Ana Beatriz',
      researcherOrganization: 'Laboratório de Biotecnologia SENAI',
      formulaVersion: 'V2 · Pétalas + quitosana',
      weightProducedKg: 4.6,
      biodegradationDays: 41,
      tensileStrength: 14.8,
      traceCode: 'PYTE5F6',
      qrCodeUrl: 'http://localhost:5173/r/PYTE5F6',
      evidenceUrl: null,
      status: 'concluido',
      notes: 'Amostra aprovada para embalagens flexíveis.',
      createdAt: isoDaysAgo(92),
      updatedAt: isoDaysAgo(88),
      origin: batchOrigin(COLLECTION_IDS[2]),
    },
    {
      id: BATCH_IDS[3],
      batchCode: 'LOTE-260601-G7H8',
      collectionId: COLLECTION_IDS[3],
      researcherId: USER_LAB,
      researcherName: 'Prof. Ana Beatriz',
      researcherOrganization: 'Laboratório de Biotecnologia SENAI',
      formulaVersion: 'V3 · Blend de pétalas',
      weightProducedKg: 7.3,
      biodegradationDays: 30,
      tensileStrength: 16.2,
      traceCode: 'PYTG7H8',
      qrCodeUrl: 'http://localhost:5173/r/PYTG7H8',
      evidenceUrl: null,
      status: 'concluido',
      notes: 'Lote de maior escala produzido até agora.',
      createdAt: isoDaysAgo(66),
      updatedAt: isoDaysAgo(60),
      origin: batchOrigin(COLLECTION_IDS[3]),
    },
    {
      id: BATCH_IDS[4],
      batchCode: 'LOTE-260701-I9J0',
      collectionId: COLLECTION_IDS[4],
      researcherId: USER_LAB,
      researcherName: 'Prof. Ana Beatriz',
      researcherOrganization: 'Laboratório de Biotecnologia SENAI',
      formulaVersion: 'V3 · Blend de pétalas',
      weightProducedKg: 3.4,
      biodegradationDays: 28,
      tensileStrength: 17.1,
      traceCode: 'PYTI9J0',
      qrCodeUrl: 'http://localhost:5173/r/PYTI9J0',
      evidenceUrl: null,
      status: 'concluido',
      notes: 'Formulação finalista para a banca.',
      createdAt: isoDaysAgo(42),
      updatedAt: isoDaysAgo(38),
      origin: batchOrigin(COLLECTION_IDS[4]),
    },
    {
      id: BATCH_IDS[5],
      batchCode: 'LOTE-260801-K1L2',
      collectionId: COLLECTION_IDS[5],
      researcherId: USER_LAB,
      researcherName: 'Prof. Ana Beatriz',
      researcherOrganization: 'Laboratório de Biotecnologia SENAI',
      formulaVersion: 'V4 · Pétalas + PLA',
      weightProducedKg: 5.8,
      biodegradationDays: 26,
      tensileStrength: 18.3,
      traceCode: 'PYTK1L2',
      qrCodeUrl: 'http://localhost:5173/r/PYTK1L2',
      evidenceUrl: null,
      status: 'em_producao',
      notes: 'Em cura e testes de resistência.',
      createdAt: isoDaysAgo(18),
      updatedAt: isoDaysAgo(6),
      origin: batchOrigin(COLLECTION_IDS[5]),
    },
  ];

  const orderWith = (
    id: string,
    clientId: string,
    batchId: string,
    quantityKg: number,
    packagingType: Order['packagingType'],
    status: Order['status'],
    notes: string,
    createdAt: string,
  ): Order => {
    const client = ensureFound(byId(clientId), 'Cliente');
    const batch = ensureFound(
      batches.find((item) => item.id === batchId),
      'Lote',
    );
    return {
      id,
      clientId,
      clientName: client.fullName,
      clientOrganization: client.organizationName,
      batchId,
      batchCode: batch.batchCode,
      formulaVersion: batch.formulaVersion,
      quantityKg,
      packagingType,
      status,
      notes,
      createdAt,
      updatedAt: createdAt,
    };
  };

  const orders: Order[] = [
    orderWith(ORDER_IDS[0], USER_CLIENT, BATCH_IDS[0], 2, 'sacola', 'entregue', 'Primeiro pedido piloto.', isoDaysAgo(138)),
    orderWith(ORDER_IDS[1], USER_CLIENT, BATCH_IDS[1], 2.5, 'filme', 'entregue', 'Filme para vitrine.', isoDaysAgo(110)),
    orderWith(ORDER_IDS[2], USER_CLIENT, BATCH_IDS[2], 1.5, 'embalagem_rigida', 'entregue', 'Caixas para cosméticos.', isoDaysAgo(84)),
    orderWith(ORDER_IDS[3], USER_CLIENT, BATCH_IDS[3], 2.8, 'sacola', 'entregue', 'Sacolas de eventos.', isoDaysAgo(58)),
    orderWith(ORDER_IDS[4], USER_CLIENT, BATCH_IDS[4], 1.2, 'filme', 'em_producao', 'Aguardando corte.', isoDaysAgo(20)),
    orderWith(ORDER_IDS[5], USER_CLIENT, BATCH_IDS[5], 1.6, 'sacola', 'aprovado', 'Amostra para loja conceito.', isoDaysAgo(8)),
    orderWith(ORDER_IDS[6], USER_CLIENT, BATCH_IDS[3], 1, 'embalagem_rigida', 'solicitado', 'Pedido recém-criado.', isoDaysAgo(1)),
    orderWith(ORDER_IDS[7], USER_CLIENT_2, BATCH_IDS[1], 1, 'filme', 'entregue', 'Parceria de teste.', isoDaysAgo(100)),
    orderWith(ORDER_IDS[8], USER_CLIENT_2, BATCH_IDS[5], 0.8, 'sacola', 'em_analise', 'Aguardando análise técnica.', isoDaysAgo(4)),
  ];

  return {
    async findUserById(id) {
      return byId(id) ?? null;
    },

    async findUserByEmail(email) {
      const normalized = email.trim().toLowerCase();
      return users.find((user) => user.email === normalized) ?? null;
    },

    async createUser(input: CreateUserInput) {
      const user: UserRecord = {
        id: crypto.randomUUID(),
        fullName: input.fullName,
        email: input.email.trim().toLowerCase(),
        passwordHash: hashPassword(input.password),
        role: input.role,
        status: input.status,
        avatarUrl: null,
        organizationName: input.organizationName,
        city: input.city,
        phone: input.phone,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      users.unshift(user);
      return user;
    },

    async updateUser(id: string, patch: UpdateUserPatch) {
      const user = byId(id);
      if (!user) return null;
      if (patch.fullName !== undefined) user.fullName = patch.fullName;
      if (patch.phone !== undefined) user.phone = patch.phone;
      if (patch.organizationName !== undefined) user.organizationName = patch.organizationName;
      if (patch.city !== undefined) user.city = patch.city;
      if (patch.avatarUrl !== undefined) user.avatarUrl = patch.avatarUrl;
      if (patch.role !== undefined) user.role = patch.role;
      if (patch.status !== undefined) user.status = patch.status;
      user.updatedAt = new Date().toISOString();
      return user;
    },

    async listUsers() {
      return [...users].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async listCollections(filter) {
      const list = filter?.floristId
        ? collections.filter((collection) => collection.floristId === filter.floristId)
        : collections;
      return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async getCollection(id) {
      return collections.find((collection) => collection.id === id) ?? null;
    },

    async createCollection(input: CreateCollectionInput) {
      const florist = ensureFound(byId(input.floristId), 'Floricultura');
      const timestamp = new Date().toISOString();
      const collection: PetalCollection = {
        id: crypto.randomUUID(),
        floristId: florist.id,
        floristName: florist.fullName,
        floristOrganization: florist.organizationName,
        floristCity: florist.city,
        weightKg: input.weightKg,
        qualityStatus: input.qualityStatus,
        pickupDate: input.pickupDate,
        status: 'solicitada',
        notes: input.notes,
        address: input.address,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      collections.unshift(collection);
      return collection;
    },

    async updateCollection(id: string, patch: UpdateCollectionPatch) {
      const collection = collections.find((item) => item.id === id);
      if (!collection) return null;
      Object.assign(collection, patch, { updatedAt: new Date().toISOString() });
      return collection;
    },

    async listBatches() {
      return [...batches].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async getBatch(id) {
      return batches.find((batch) => batch.id === id) ?? null;
    },

    async getBatchByTraceCode(traceCode) {
      const normalized = traceCode.trim().toUpperCase();
      return batches.find((batch) => batch.traceCode.toUpperCase() === normalized) ?? null;
    },

    async createBatch(input: CreateBatchInput) {
      const researcher = ensureFound(byId(input.researcherId), 'Pesquisador');
      const collection = ensureFound(
        collections.find((item) => item.id === input.collectionId),
        'Coleta',
      );
      const timestamp = new Date().toISOString();
      const batch: BioplasticBatch = {
        id: crypto.randomUUID(),
        batchCode: input.batchCode,
        collectionId: input.collectionId,
        researcherId: researcher.id,
        researcherName: researcher.fullName,
        researcherOrganization: researcher.organizationName,
        formulaVersion: input.formulaVersion,
        weightProducedKg: input.weightProducedKg,
        biodegradationDays: input.biodegradationDays,
        tensileStrength: input.tensileStrength,
        traceCode: input.traceCode,
        qrCodeUrl: input.qrCodeUrl,
        evidenceUrl: null,
        status: input.status ?? 'concluido',
        notes: input.notes,
        createdAt: timestamp,
        updatedAt: timestamp,
        origin: batchOrigin(collection.id),
      };
      batches.unshift(batch);
      return batch;
    },

    async updateBatch(id: string, patch: UpdateBatchPatch) {
      const batch = batches.find((item) => item.id === id);
      if (!batch) return null;
      Object.assign(batch, patch, { updatedAt: new Date().toISOString() });
      return batch;
    },

    async listOrders(filter) {
      const list = filter?.clientId
        ? orders.filter((order) => order.clientId === filter.clientId)
        : orders;
      return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async getOrder(id) {
      return orders.find((order) => order.id === id) ?? null;
    },

    async createOrder(input: CreateOrderInput) {
      const client = ensureFound(byId(input.clientId), 'Cliente');
      const batch = ensureFound(
        batches.find((item) => item.id === input.batchId),
        'Lote',
      );
      const timestamp = new Date().toISOString();
      const order: Order = {
        id: crypto.randomUUID(),
        clientId: client.id,
        clientName: client.fullName,
        clientOrganization: client.organizationName,
        batchId: batch.id,
        batchCode: batch.batchCode,
        formulaVersion: batch.formulaVersion,
        quantityKg: input.quantityKg,
        packagingType: input.packagingType,
        status: 'solicitado',
        notes: input.notes,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      orders.unshift(order);
      return order;
    },

    async updateOrder(id: string, patch: UpdateOrderPatch) {
      const order = orders.find((item) => item.id === id);
      if (!order) return null;
      Object.assign(order, patch, { updatedAt: new Date().toISOString() });
      return order;
    },
  };
}
