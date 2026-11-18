export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const API_BASE = ((import.meta.env.VITE_API_URL as string | undefined) ?? '/api').replace(/\/$/, '');
const TOKEN_KEY = 'pytangy.token';
const USER_KEY = 'pytangy.user';

let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function storeToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function storeUser(user: unknown | null) {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
}

export function getStoredUser<T>(): T | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function formatErrorMessage(payload: unknown): string {
  const data = payload as
    | {
        error?: {
          message?: string;
          details?: { fieldErrors?: Record<string, string[]>; formErrors?: string[] };
        };
      }
    | null;

  const base = data?.error?.message ?? 'Não foi possível concluir a solicitação.';
  const details = data?.error?.details;
  const firstDetail =
    details?.formErrors?.[0] ??
    (details?.fieldErrors ? Object.values(details.fieldErrors).flat()[0] : undefined);

  if (firstDetail && !base.includes(firstDetail)) return `${base} ${firstDetail}`;
  return base;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  formData?: FormData;
  signal?: AbortSignal;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers();
  const token = getStoredToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let body: BodyInit | undefined;
  if (options.formData) {
    body = options.formData;
  } else if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(options.body);
  }

  const method = options.method ?? (options.body !== undefined || options.formData ? 'POST' : 'GET');

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body,
      signal: options.signal,
    });
  } catch {
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      'Não foi possível conectar ao servidor. Verifique se a API está em execução.',
    );
  }

  if (response.status === 401) {
    unauthorizedHandler?.();
  }

  if (response.status === 204) return undefined as T;

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const data = payload as { error?: { code?: string; message?: string } } | null;
    throw new ApiError(
      response.status,
      data?.error?.code ?? 'REQUEST_FAILED',
      formatErrorMessage(payload),
      data?.error,
    );
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  upload: <T>(path: string, formData: FormData) => request<T>(path, { method: 'POST', formData }),
};

export function apiAssetUrl(path: string): string {
  return `${API_BASE}${path}`;
}
