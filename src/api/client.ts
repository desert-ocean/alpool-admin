import { getAccessToken } from '../auth/session';
import type { ApiErrorBody } from '../types/api';

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
export const API_BASE_URL = (configuredBaseUrl || 'https://api.alpool.ru').replace(/\/$/, '');

export class ApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody | null;

  constructor(status: number, message: string, body: ApiErrorBody | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler;
}

interface RequestOptions extends RequestInit {
  auth?: boolean;
}

async function readErrorBody(response: Response): Promise<ApiErrorBody | null> {
  try {
    const parsed: unknown = await response.json();
    if (parsed && typeof parsed === 'object') {
      return parsed as ApiErrorBody;
    }
  } catch {
    // Some network and proxy errors have no JSON body.
  }
  return null;
}

function defaultErrorMessage(status: number): string {
  if (status === 401) return 'Сессия истекла. Войдите снова.';
  if (status === 404) return 'Запрашиваемый объект не найден.';
  if (status === 422) return 'Проверьте корректность данных.';
  if (status === 503) return 'Сервис авторизации временно недоступен.';
  return 'Не удалось выполнить запрос. Попробуйте ещё раз.';
}

export function extractErrorMessage(body: ApiErrorBody | null, status?: number): string {
  const detail = body?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => (item && typeof item.msg === 'string' ? item.msg : ''))
      .filter(Boolean);
    if (messages.length > 0) return messages.join('. ');
  }
  return defaultErrorMessage(status ?? 0);
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = true, headers: providedHeaders, ...requestInit } = options;
  const headers = new Headers(providedHeaders);
  if (requestInit.body && !(requestInit.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (auth) {
    const token = getAccessToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...requestInit, headers });
  } catch {
    throw new ApiError(0, 'Не удалось связаться с API. Проверьте соединение и попробуйте ещё раз.');
  }

  if (response.status === 401 && auth) {
    unauthorizedHandler?.();
  }

  if (!response.ok) {
    const body = await readErrorBody(response);
    throw new ApiError(response.status, extractErrorMessage(body, response.status), body);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

async function requestBlob(path: string): Promise<Response> {
  const token = getAccessToken();
  const headers = new Headers();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { headers });
  } catch {
    throw new ApiError(0, 'Не удалось скачать файл. Проверьте соединение и попробуйте ещё раз.');
  }

  if (response.status === 401) unauthorizedHandler?.();
  if (!response.ok) {
    const body = await readErrorBody(response);
    throw new ApiError(response.status, extractErrorMessage(body, response.status), body);
  }
  return response;
}

export const apiClient = {
  request,
  requestBlob,
};
