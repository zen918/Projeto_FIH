export class ApiError extends Error {
  statusCode: number;
  code: string;
  details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new ApiError(400, 'BAD_REQUEST', message, details);

export const unauthorized = (message = 'Autenticação necessária.') =>
  new ApiError(401, 'UNAUTHORIZED', message);

export const forbidden = (message = 'Você não tem permissão para esta ação.', code = 'FORBIDDEN') =>
  new ApiError(403, code, message);

export const notFound = (message = 'Registro não encontrado.') =>
  new ApiError(404, 'NOT_FOUND', message);

export const conflict = (message: string, code = 'CONFLICT') =>
  new ApiError(409, code, message);
