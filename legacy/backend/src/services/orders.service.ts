import type { Order, OrderStatus, PackagingType, Profile } from '../domain/types';
import { conflict, forbidden, notFound } from '../errors';
import { store } from '../repositories';

export interface CreateOrderPayload {
  batchId: string;
  quantityKg: number;
  packagingType: PackagingType;
  notes: string;
}

export interface UpdateOrderPayload {
  status?: OrderStatus;
  notes?: string;
}

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  solicitado: ['em_analise', 'aprovado', 'cancelado'],
  em_analise: ['aprovado', 'cancelado'],
  aprovado: ['em_producao', 'cancelado'],
  em_producao: ['entregue', 'cancelado'],
  entregue: [],
  cancelado: [],
};

export class OrdersService {
  async list(user: Profile): Promise<Order[]> {
    if (user.role === 'comercio_cliente') {
      return store.listOrders({ clientId: user.id });
    }
    if (user.role === 'pesquisador_lab' || user.role === 'superadmin') {
      return store.listOrders();
    }
    throw forbidden('Seu perfil não tem acesso ao módulo de pedidos.');
  }

  async create(user: Profile, input: CreateOrderPayload): Promise<Order> {
    if (user.role !== 'comercio_cliente') {
      throw forbidden('Somente comércios clientes podem realizar pedidos.');
    }

    const batch = await store.getBatch(input.batchId);
    if (!batch) throw notFound('Lote de bioplástico não encontrado.');
    if (batch.status === 'arquivado') {
      throw conflict('Este lote está arquivado e não está disponível para pedidos.');
    }

    const allOrders = await store.listOrders();
    const reserved = allOrders
      .filter((order) => order.batchId === batch.id && order.status !== 'cancelado')
      .reduce((total, order) => total + order.quantityKg, 0);

    const available = Math.round((batch.weightProducedKg - reserved) * 1000) / 1000;
    if (input.quantityKg > available) {
      throw conflict(
        available <= 0
          ? 'Este lote não possui mais quantidade disponível.'
          : `Quantidade indisponível. Restam ${available} kg deste lote.`,
        'INSUFFICIENT_STOCK',
      );
    }

    return store.createOrder({
      clientId: user.id,
      batchId: batch.id,
      quantityKg: input.quantityKg,
      packagingType: input.packagingType,
      notes: input.notes.trim(),
    });
  }

  async update(user: Profile, orderId: string, input: UpdateOrderPayload): Promise<Order> {
    const order = await store.getOrder(orderId);
    if (!order) throw notFound('Pedido não encontrado.');

    if (user.role === 'comercio_cliente') {
      if (order.clientId !== user.id) throw forbidden('Você só pode gerenciar os seus pedidos.');
      if (input.status && input.status !== 'cancelado') {
        throw forbidden('O cliente pode apenas cancelar o próprio pedido.');
      }
      if (input.status === 'cancelado' && !['solicitado', 'em_analise'].includes(order.status)) {
        throw conflict('Este pedido já entrou em produção e não pode mais ser cancelado pelo cliente.');
      }
    } else if (user.role === 'pesquisador_lab' || user.role === 'superadmin') {
      if (input.status && input.status !== order.status) {
        if (!TRANSITIONS[order.status].includes(input.status)) {
          throw conflict(
            `Transição inválida: ${order.status} → ${input.status}.`,
            'INVALID_STATUS_TRANSITION',
          );
        }
      }
    } else {
      throw forbidden('Seu perfil não pode atualizar pedidos.');
    }

    const updated = await store.updateOrder(orderId, {
      status: input.status,
      notes: input.notes?.trim(),
    });
    if (!updated) throw notFound('Pedido não encontrado.');
    return updated;
  }
}
