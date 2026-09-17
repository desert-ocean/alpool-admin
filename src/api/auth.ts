import { apiClient } from './client';
import { isDemoMode } from '../config/runtime';
import type { TokenResponse } from '../types/api';

export function login(username: string, password: string): Promise<TokenResponse> {
  if (isDemoMode()) return Promise.reject(new Error('Вход отключён в demo-preview.'));
  return apiClient.request<TokenResponse>('/api/auth/login', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ username, password }),
  });
}
