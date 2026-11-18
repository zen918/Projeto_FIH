import type { Profile } from '../domain/types';

declare global {
  namespace Express {
    interface Request {
      user?: Profile;
    }
  }
}

export {};
