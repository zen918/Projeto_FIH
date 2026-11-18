import type { RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';
import { ApiError } from '../errors';

type AsyncRoute = (
  req: Parameters<RequestHandler>[0],
  res: Parameters<RequestHandler>[1],
  next: Parameters<RequestHandler>[2],
) => unknown;

/** Encaminha rejeições de handlers assíncronos para o error handler do Express. */
export function asyncHandler(handler: AsyncRoute): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export function validateBody<T extends ZodTypeAny>(schema: T): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(
        new ApiError(422, 'VALIDATION_ERROR', 'Revise os campos informados.', result.error.flatten()),
      );
      return;
    }
    req.body = result.data;
    next();
  };
}
