import type { Profile } from '../domain/types';
import { notFound } from '../errors';
import { store } from '../repositories';
import { toProfile } from '../repositories/contracts';
import type { UpdateUserPatch } from '../repositories/contracts';
import { StorageService } from './storage.service';

export interface UpdateProfilePayload {
  fullName?: string;
  phone?: string;
  organizationName?: string;
  city?: string;
}

export class ProfileService {
  private storage = new StorageService();

  async update(user: Profile, input: UpdateProfilePayload): Promise<Profile> {
    const patch: UpdateUserPatch = {};
    if (input.fullName !== undefined) patch.fullName = input.fullName.trim();
    if (input.phone !== undefined) patch.phone = input.phone.trim();
    if (input.organizationName !== undefined) patch.organizationName = input.organizationName.trim();
    if (input.city !== undefined) patch.city = input.city.trim();

    const updated = await store.updateUser(user.id, patch);
    if (!updated) throw notFound('Perfil não encontrado.');
    return toProfile(updated);
  }

  async updateAvatar(user: Profile, file: Express.Multer.File | undefined): Promise<Profile> {
    const avatarUrl = await this.storage.uploadAvatar(user.id, file);
    const updated = await store.updateUser(user.id, { avatarUrl });
    if (!updated) throw notFound('Perfil não encontrado.');
    return toProfile(updated);
  }
}
