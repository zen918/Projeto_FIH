import type { Profile, Role, UserStatus } from '../domain/types';
import { conflict, forbidden, notFound } from '../errors';
import { store } from '../repositories';
import { toProfile } from '../repositories/contracts';

export interface AdminUpdateUserPayload {
  role?: Role;
  status?: UserStatus;
}

export class AdminService {
  async listUsers(user: Profile) {
    if (user.role !== 'superadmin') {
      throw forbidden('Apenas o SuperAdmin pode gerenciar contas.');
    }
    const users = await store.listUsers();
    return users.map(toProfile);
  }

  async updateUser(user: Profile, targetId: string, input: AdminUpdateUserPayload) {
    if (user.role !== 'superadmin') {
      throw forbidden('Apenas o SuperAdmin pode gerenciar contas.');
    }

    const target = await store.findUserById(targetId);
    if (!target) throw notFound('Usuário não encontrado.');

    if (target.id === user.id) {
      throw conflict('Você não pode alterar o próprio perfil de acesso.', 'CANNOT_EDIT_SELF');
    }

    const promotingLastAdmin =
      target.role === 'superadmin' &&
      ((input.role !== undefined && input.role !== 'superadmin') ||
        (input.status !== undefined && input.status !== 'active'));

    if (promotingLastAdmin) {
      const users = await store.listUsers();
      const activeSuperadmins = users.filter(
        (item) => item.role === 'superadmin' && item.status === 'active',
      );
      if (activeSuperadmins.length <= 1) {
        throw conflict(
          'É necessário manter ao menos um SuperAdmin ativo na plataforma.',
          'LAST_SUPERADMIN',
        );
      }
    }

    const updated = await store.updateUser(targetId, {
      role: input.role,
      status: input.status,
    });
    if (!updated) throw notFound('Usuário não encontrado.');
    return toProfile(updated);
  }
}
