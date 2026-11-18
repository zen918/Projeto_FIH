import type {
  BatchStatus,
  BioplasticBatch,
  CollectionStatus,
  Order,
  OrderStatus,
  PackagingType,
  PetalCollection,
  Profile,
  QualityStatus,
  Role,
  UserRecord,
  UserStatus,
} from '../domain/types';

export interface CreateUserInput {
  fullName: string;
  email: string;
  password: string;
  role: Role;
  status: UserStatus;
  organizationName: string;
  city: string;
  phone: string;
}

export interface UpdateUserPatch {
  fullName?: string;
  phone?: string;
  organizationName?: string;
  city?: string;
  avatarUrl?: string | null;
  role?: Role;
  status?: UserStatus;
}

export interface CreateCollectionInput {
  floristId: string;
  weightKg: number;
  qualityStatus: QualityStatus;
  pickupDate: string;
  notes: string;
  address: string;
}

export interface UpdateCollectionPatch {
  weightKg?: number;
  qualityStatus?: QualityStatus;
  pickupDate?: string;
  notes?: string;
  address?: string;
  status?: CollectionStatus;
}

export interface CreateBatchInput {
  batchCode: string;
  collectionId: string;
  researcherId: string;
  formulaVersion: string;
  weightProducedKg: number;
  biodegradationDays: number;
  tensileStrength: number;
  traceCode: string;
  qrCodeUrl: string;
  notes: string;
  status?: BatchStatus;
}

export interface UpdateBatchPatch {
  status?: BatchStatus;
  notes?: string;
  evidenceUrl?: string | null;
}

export interface CreateOrderInput {
  clientId: string;
  batchId: string;
  quantityKg: number;
  packagingType: PackagingType;
  notes: string;
}

export interface UpdateOrderPatch {
  status?: OrderStatus;
  notes?: string;
}

export interface Store {
  findUserById(id: string): Promise<UserRecord | null>;
  findUserByEmail(email: string): Promise<UserRecord | null>;
  createUser(input: CreateUserInput): Promise<UserRecord>;
  updateUser(id: string, patch: UpdateUserPatch): Promise<UserRecord | null>;
  listUsers(): Promise<UserRecord[]>;

  listCollections(filter?: { floristId?: string }): Promise<PetalCollection[]>;
  getCollection(id: string): Promise<PetalCollection | null>;
  createCollection(input: CreateCollectionInput): Promise<PetalCollection>;
  updateCollection(id: string, patch: UpdateCollectionPatch): Promise<PetalCollection | null>;

  listBatches(): Promise<BioplasticBatch[]>;
  getBatch(id: string): Promise<BioplasticBatch | null>;
  getBatchByTraceCode(traceCode: string): Promise<BioplasticBatch | null>;
  createBatch(input: CreateBatchInput): Promise<BioplasticBatch>;
  updateBatch(id: string, patch: UpdateBatchPatch): Promise<BioplasticBatch | null>;

  listOrders(filter?: { clientId?: string }): Promise<Order[]>;
  getOrder(id: string): Promise<Order | null>;
  createOrder(input: CreateOrderInput): Promise<Order>;
  updateOrder(id: string, patch: UpdateOrderPatch): Promise<Order | null>;
}

export function toProfile(user: UserRecord): Profile {
  const { passwordHash: _passwordHash, ...profile } = user;
  return profile;
}
