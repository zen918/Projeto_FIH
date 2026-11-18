import {
  FlaskConical,
  Flower2,
  LayoutDashboard,
  PackageCheck,
  ShieldCheck,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import type { Role } from '../types';

export interface NavItem {
  label: string;
  shortLabel: string;
  to: string;
  icon: LucideIcon;
  roles: Role[];
  end?: boolean;
}

const ALL_ROLES: Role[] = ['superadmin', 'floricultura', 'comercio_cliente', 'pesquisador_lab'];

export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Visão geral',
    shortLabel: 'Início',
    to: '/app',
    icon: LayoutDashboard,
    roles: ALL_ROLES,
    end: true,
  },
  {
    label: 'Coletas de pétalas',
    shortLabel: 'Coletas',
    to: '/app/coletas',
    icon: Flower2,
    roles: ['floricultura', 'pesquisador_lab', 'superadmin'],
  },
  {
    label: 'Lotes de bioplástico',
    shortLabel: 'Lotes',
    to: '/app/lotes',
    icon: FlaskConical,
    roles: ['pesquisador_lab', 'superadmin', 'comercio_cliente'],
  },
  {
    label: 'Pedidos B2B',
    shortLabel: 'Pedidos',
    to: '/app/pedidos',
    icon: PackageCheck,
    roles: ['comercio_cliente', 'pesquisador_lab', 'superadmin'],
  },
  {
    label: 'Administração',
    shortLabel: 'Admin',
    to: '/app/admin',
    icon: ShieldCheck,
    roles: ['superadmin'],
  },
  {
    label: 'Meu perfil',
    shortLabel: 'Perfil',
    to: '/app/perfil',
    icon: UserRound,
    roles: ALL_ROLES,
  },
];

export function navForRole(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}

export interface QuickAction {
  label: string;
  to: string;
  description: string;
}

export const QUICK_ACTIONS: Record<Role, QuickAction> = {
  superadmin: {
    label: 'Administração',
    to: '/app/admin',
    description: 'Aprovar contas e gerenciar acessos',
  },
  floricultura: {
    label: 'Nova coleta',
    to: '/app/coletas?new=1',
    description: 'Registrar pétalas disponíveis',
  },
  comercio_cliente: {
    label: 'Novo pedido',
    to: '/app/pedidos?new=1',
    description: 'Solicitar bioplástico',
  },
  pesquisador_lab: {
    label: 'Novo lote',
    to: '/app/lotes?new=1',
    description: 'Registrar produção e QR Code',
  },
};

export const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/app': { title: 'Visão geral', subtitle: 'Impacto circular em tempo real' },
  '/app/coletas': { title: 'Coletas', subtitle: 'Biomassa floral e logística reversa' },
  '/app/lotes': { title: 'Lotes', subtitle: 'Bioplástico, formulações e rastreabilidade' },
  '/app/pedidos': { title: 'Pedidos', subtitle: 'Relações comerciais B2B' },
  '/app/admin': { title: 'Administração', subtitle: 'Contas, permissões e auditoria' },
  '/app/perfil': { title: 'Meu perfil', subtitle: 'Seus dados e preferências' },
};
