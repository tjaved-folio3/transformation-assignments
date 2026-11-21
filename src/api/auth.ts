import type { LoginRequest, LoginResponse, User } from '../types/api.ts';
import { apiRequest } from './client.ts';

export function login(credentials: LoginRequest) {
  return apiRequest<LoginResponse>('/login', { method: 'POST', body: credentials });
}

export function fetchMe(signal?: AbortSignal) {
  return apiRequest<User>('/me', { signal });
}
