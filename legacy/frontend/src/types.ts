export type Role = 'superadmin' | 'floricultura' | 'comercio_cliente' | 'pesquisador_lab';
export type UserStatus = 'pending' | 'active' | 'blocked';
export type CollectionStatus = 'solicitada' | 'agendada' | 'coletada' | 'processada' | 'cancelada';
export type QualityStatus = 'excelente' | 'boa' | 'regular' | 'critica';
export type BatchStatus = 'em_producao' | 'concluido' | 'arquivado';
export type OrderStatus =
  | 'solicitado'
  | 'em_analise'
  | 'aprovado'
  | 'em_producao'
  | 'entregue'
  | 'cancelado';
export type PackagingType = 'sacola' | 'filme' | 'embalagem_rigida' | 'outro';

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

export interface SessionResponse {
  token: string | null;
  user: Profile;
  pending: boolean;
  demo: boolean;
}

export interface HealthResponse {
  status: string;
  app: string;
  version: string;
  demoMode: boolean;
  timestamp: string;
}

export interface DemoAccountsResponse {
  password: string;
  accounts: Array<{ email: string; role: Role; label: string }>;
}

export interface CreateCollectionInput {
  weightKg: number;
  qualityStatus: QualityStatus;
  pickupDate: string;
  notes: string;
  address: string;
}

export interface CreateBatchInput {
  collectionId: string;
  formulaVersion: string;
  weightProducedKg: number;
  biodegradationDays: number;
  tensileStrength: number;
  notes: string;
}

export interface CreateOrderInput {
  batchId: string;
  quantityKg: number;
  packagingType: PackagingType;
  notes: string;
}
