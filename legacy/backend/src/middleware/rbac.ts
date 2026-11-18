import type { RequestHandler } from 'express';
import type { Role } from '../domain/types';
import { forbidden, unauthorized } from '../errors';

export function requireRole(...roles: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      next(unauthorized());
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(
        forbidden(
          'Seu perfil de acesso não permite executar esta ação.',
          'ROLE_NOT_ALLOWED',
        ),
      );
      return;
    }
    next();
  };
}
