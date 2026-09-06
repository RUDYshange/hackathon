// Front-end auth service — talks to the Django auth endpoints and returns a
// ready-to-store AuthSession (token + account). All network/validation errors
// are surfaced as a friendly message.

import { secureFetch } from '../services/api';
import type { AccountRole, AuthSession } from './session';

export interface AuthResult {
  session?: AuthSession;
  error?: string;
}

function toResult(res: { data?: AuthSession; error?: string }, fallback: string): AuthResult {
  if (res.data && res.data.token) return { session: res.data };
  return { error: res.error || fallback };
}

export async function register(
  role: AccountRole,
  name: string,
  email: string,
  password: string,
): Promise<AuthResult> {
  const res = await secureFetch<AuthSession>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ role, name, email, password }),
  });
  return toResult(res, 'We could not create your account. Please try again.');
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const res = await secureFetch<AuthSession>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return toResult(res, 'Incorrect email or password.');
}

/** Best-effort token invalidation; the local session is cleared regardless. */
export async function logout(): Promise<void> {
  try {
    await secureFetch('/auth/logout', { method: 'POST' });
  } catch {
    /* ignore — clearing the local session is what matters */
  }
}
