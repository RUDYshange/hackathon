// Front-end auth session (token-based).
//
// The session now mirrors a real backend login: it holds the DRF auth token
// plus the resolved account (role, name, email, and — for customers — the
// linked client id). secureFetch attaches the token to every API request, and
// the app restores the workspace on reload.

export type AccountRole = 'customer' | 'business';

export interface AuthSession {
  token: string;
  role: AccountRole;
  name: string;
  email: string;
  clientId?: string | null;
  clientReference?: string | null;
}

const SESSION_KEY = 'rsq_auth_session';

export function loadSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Require a token + valid role — this also discards any pre-token session.
    if (parsed && parsed.token && (parsed.role === 'customer' || parsed.role === 'business')) {
      return parsed as AuthSession;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveSession(session: AuthSession): AuthSession {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    /* storage unavailable — session stays in memory for this tab only */
  }
  return session;
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

/** Convenience for secureFetch: the current bearer token, if signed in. */
export function getToken(): string | null {
  return loadSession()?.token ?? null;
}
