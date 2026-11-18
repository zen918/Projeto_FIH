import type {
  BatchStatus,
  CollectionStatus,
  OrderStatus,
  PackagingType,
  QualityStatus,
  Role,
  UserStatus,
} from '../types';

export type BadgeTone = 'rose' | 'sage' | 'amber' | 'zinc' | 'sky' | 'red';

export const ROLE_LABELS: Record<Role, string> = {
  superadmin: 'SuperAdmin · FIH',
  floricultura: 'Floricultura',
  comercio_cliente: 'Comércio B2B',
  pesquisador_lab: 'Pesquisador · Lab',
};

export const ROLE_SHORT_LABELS: Record<Role, string> = {
  superadmin: 'SuperAdmin',
  floricultura: 'Floricultura',
  comercio_cliente: 'Comércio',
  pesquisador_lab: 'Laboratório',
};

export const ROLE_TONES: Record<Role, BadgeTone> = {
  superadmin: 'rose',
  floricultura: 'sage',
  comercio_cliente: 'amber',
  pesquisador_lab: 'sky',
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  superadmin: 'Gestão central, aprovação de contas e auditoria de toda a operação.',
  floricultura: 'Registre pétalas disponíveis, agende coletas e acompanhe seu impacto.',
  comercio_cliente: 'Explore o catálogo de bioplástico, faça pedidos e receba seu selo verde.',
  pesquisador_lab: 'Controle formulações, lotes, QR Codes e evidências de qualidade.',
};

export const SELF_SERVICE_ROLES: Role[] = ['floricultura', 'comercio_cliente', 'pesquisador_lab'];

export const PACKAGING_LABELS: Record<PackagingType, string> = {
  sacola: 'Sacola biodegradável',
  filme: 'Filme flexível',
  embalagem_rigida: 'Embalagem rígida',
  outro: 'Outro formato',
};

export const QUALITY_LABELS: Record<QualityStatus, string> = {
  excelente: 'Excelente',
  boa: 'Boa',
  regular: 'Regular',
  critica: 'Crítica',
};

export const STATUS_META: Record<string, { label: string; tone: BadgeTone }> = {
  pending: { label: 'Em análise', tone: 'amber' },
  active: { label: 'Ativo', tone: 'sage' },
  blocked: { label: 'Bloqueado', tone: 'red' },

  solicitada: { label: 'Solicitada', tone: 'amber' },
  agendada: { label: 'Agendada', tone: 'sky' },
  coletada: { label: 'Coletada', tone: 'rose' },
  processada: { label: 'Processada', tone: 'sage' },
  cancelada: { label: 'Cancelada', tone: 'zinc' },

  em_producao: { label: 'Em produção', tone: 'amber' },
  concluido: { label: 'Concluído', tone: 'sage' },
  arquivado: { label: 'Arquivado', tone: 'zinc' },

  solicitado: { label: 'Solicitado', tone: 'amber' },
  em_analise: { label: 'Em análise', tone: 'sky' },
  aprovado: { label: 'Aprovado', tone: 'sage' },
  entregue: { label: 'Entregue', tone: 'sage' },
  cancelado: { label: 'Cancelado', tone: 'zinc' },

  excelente: { label: 'Excelente', tone: 'sage' },
  boa: { label: 'Boa', tone: 'sky' },
  regular: { label: 'Regular', tone: 'amber' },
  critica: { label: 'Crítica', tone: 'red' },
};

export const COLLECTION_STATUS_OPTIONS: Array<{ value: CollectionStatus; label: string }> = [
  { value: 'solicitada', label: 'Solicitada' },
  { value: 'agendada', label: 'Agendada' },
  { value: 'coletada', label: 'Coletada' },
  { value: 'processada', label: 'Processada' },
  { value: 'cancelada', label: 'Cancelada' },
];

export const ORDER_STATUS_OPTIONS: Array<{ value: OrderStatus; label: string }> = [
  { value: 'solicitado', label: 'Solicitado' },
  { value: 'em_analise', label: 'Em análise' },
  { value: 'aprovado', label: 'Aprovado' },
  { value: 'em_producao', label: 'Em produção' },
  { value: 'entregue', label: 'Entregue' },
  { value: 'cancelado', label: 'Cancelado' },
];

export const BATCH_STATUS_OPTIONS: Array<{ value: BatchStatus; label: string }> = [
  { value: 'em_producao', label: 'Em produção' },
  { value: 'concluido', label: 'Concluído' },
  { value: 'arquivado', label: 'Arquivado' },
];

export const USER_STATUS_OPTIONS: Array<{ value: UserStatus; label: string }> = [
  { value: 'pending', label: 'Em análise' },
  { value: 'active', label: 'Ativo' },
  { value: 'blocked', label: 'Bloqueado' },
];

export const NEXT_COLLECTION_STATUS: Partial<Record<CollectionStatus, CollectionStatus>> = {
  solicitada: 'agendada',
  agendada: 'coletada',
  coletada: 'processada',
};

export const NEXT_ORDER_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  solicitado: 'em_analise',
  em_analise: 'aprovado',
  aprovado: 'em_producao',
  em_producao: 'entregue',
};

export const NEXT_BATCH_STATUS: Partial<Record<BatchStatus, BatchStatus>> = {
  em_producao: 'concluido',
  concluido: 'arquivado',
};
