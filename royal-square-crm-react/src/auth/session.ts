// Lightweight front-end auth session.
//
// This is a demo/hackathon session store — it does NOT perform real
// authentication or store credentials. It only remembers which workspace the
// user chose (client vs advisor) plus a display name/email, so the app can
// route them and restore the choice on reload. Wire this to a real auth backend
// before production.

export type AccountRole = 'customer' | 'business';

export interface AuthSession {
  role: AccountRole;
  name: string;
  email: string;
  /** Epoch ms when the session was created. */
  createdAt: number;
}

const SESSION_KEY = 'rsq_auth_session';

export function loadSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && (parsed.role === 'customer' || parsed.role === 'business')) {
      return parsed as AuthSession;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveSession(session: Omit<AuthSession, 'createdAt'>): AuthSession {
  const full: AuthSession = { ...session, createdAt: Date.now() };
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(full));
  } catch {
    /* storage unavailable — session stays in memory for this tab only */
  }
  return full;
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}
