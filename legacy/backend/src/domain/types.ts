export const ROLES = ['superadmin', 'floricultura', 'comercio_cliente', 'pesquisador_lab'] as const;
export type Role = (typeof ROLES)[number];

export const USER_STATUSES = ['pending', 'active', 'blocked'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const COLLECTION_STATUSES = ['solicitada', 'agendada', 'coletada', 'processada', 'cancelada'] as const;
export type CollectionStatus = (typeof COLLECTION_STATUSES)[number];

export const QUALITY_STATUSES = ['excelente', 'boa', 'regular', 'critica'] as const;
export type QualityStatus = (typeof QUALITY_STATUSES)[number];

export const BATCH_STATUSES = ['em_producao', 'concluido', 'arquivado'] as const;
export type BatchStatus = (typeof BATCH_STATUSES)[number];

export const ORDER_STATUSES = [
  'solicitado',
  'em_analise',
  'aprovado',
  'em_producao',
  'entregue',
  'cancelado',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PACKAGING_TYPES = ['sacola', 'filme', 'embalagem_rigida', 'outro'] as const;
export type PackagingType = (typeof PACKAGING_TYPES)[number];

export interface Profile {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  status: UserStatus;
  avatarUrl: string | null;
  organizationName: string;
  city: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserRecord extends Profile {
  /** Somente no modo demo (scrypt). No Supabase a senha fica em auth.users. */
  passwordHash?: string | null;
}

export interface PetalCollection {
  id: string;
  floristId: string;
  floristName: string;
  floristOrganization: string;
  floristCity: string;
  weightKg: number;
  qualityStatus: QualityStatus;
  pickupDate: string;
  status: CollectionStatus;
  notes: string;
  address: string;
  createdAt: string;
  updatedAt: string;
}

export interface BatchOrigin {
  collectionId: string;
  floristId: string;
  floristName: string;
  floristOrganization: string;
  floristCity: string;
  petalWeightKg: number;
  qualityStatus: QualityStatus;
  pickupDate: string;
}

export interface BioplasticBatch {
  id: string;
  batchCode: string;
  collectionId: string;
  researcherId: string;
  researcherName: string;
  researcherOrganization: string;
  formulaVersion: string;
  weightProducedKg: number;
  biodegradationDays: number;
  tensileStrength: number;
  traceCode: string;
  qrCodeUrl: string;
  evidenceUrl: string | null;
  status: BatchStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
  origin: BatchOrigin | null;
}

export interface Order {
  id: string;
  clientId: string;
  clientName: string;
  clientOrganization: string;
  batchId: string;
  batchCode: string;
  formulaVersion: string;
  quantityKg: number;
  packagingType: PackagingType;
  status: OrderStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ImpactMetrics {
  petalsDivertedKg: number;
  bioplasticProducedKg: number;
  fossilPlasticAvoidedKg: number;
  bagsEquivalent: number;
  co2AvoidedKg: number;
}

export interface MonthlyImpact {
  month: string;
  label: string;
  petalsKg: number;
  bioplasticKg: number;
}

export interface ImpactResponse {
  global: ImpactMetrics;
  personal: ImpactMetrics;
  monthly: MonthlyImpact[];
  counters: {
    collections: number;
    batches: number;
    orders: number;
    users: number;
    pendingUsers: number;
  };
}

export interface TraceResult {
  batch: {
    batchCode: string;
    traceCode: string;
    formulaVersion: string;
    weightProducedKg: number;
    biodegradationDays: number;
    tensileStrength: number;
    status: BatchStatus;
    createdAt: string;
    evidenceUrl: string | null;
  };
  origin: {
    floristName: string;
    organizationName: string;
    city: string;
    petalWeightKg: number;
    qualityStatus: QualityStatus;
    pickupDate: string;
    collectedAt: string;
  } | null;
  researcher: {
    name: string;
    organizationName: string;
  } | null;
  impact: ImpactMetrics;
  timeline: Array<{ title: string; description: string; date: string | null }>;
}
