// Demo credential store (front-end only).
//
// These are shareable demo logins for the hackathon build — NOT a real auth
// system. Passwords live in plain text here on purpose so the accounts can be
// handed out and used to explore each workspace. Sign-ups are persisted to
// localStorage so a freshly created account can sign in again on the same
// device. Replace all of this with a real backend before production.

import type { AccountRole } from './session';

export interface DemoAccount {
  role: AccountRole;
  name: string;
  email: string;
  password: string;
  /** Short blurb shown in the demo-accounts helper. */
  blurb: string;
}

// Built-in accounts that always work.
export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: 'business',
    name: 'Qiniso Ntuli',
    email: 'advisor@royalsquare.co.za',
    password: 'Advisor@2026',
    blurb: 'Advisory console — clients, claims, compliance & reminders (live CRM data).',
  },
  {
    role: 'customer',
    name: 'Kagiso & Lerato Mokoena',
    email: 'client@royalsquare.co.za',
    password: 'Client@2026',
    blurb: 'Client portal — family wealth dashboard & claim journeys.',
  },
];

interface StoredAccount {
  role: AccountRole;
  name: string;
  email: string;
  password: string;
}

const REG_KEY = 'rsq_registered_accounts';

function loadRegistered(): StoredAccount[] {
  try {
    const list = JSON.parse(localStorage.getItem(REG_KEY) || '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function saveRegistered(list: StoredAccount[]): void {
  try {
    localStorage.setItem(REG_KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable — account stays for this tab only */
  }
}

const norm = (email: string) => email.trim().toLowerCase();

export function findAccount(email: string): StoredAccount | undefined {
  const e = norm(email);
  return (
    DEMO_ACCOUNTS.find((a) => a.email.toLowerCase() === e) ||
    loadRegistered().find((a) => a.email.toLowerCase() === e)
  );
}

export function emailExists(email: string): boolean {
  return !!findAccount(email);
}

/** Returns the matching account when email + password are correct, else null. */
export function verifyCredentials(email: string, password: string): StoredAccount | null {
  const acc = findAccount(email);
  return acc && acc.password === password ? acc : null;
}

/** Persist a newly signed-up account so it can sign in again later. */
export function registerAccount(acc: StoredAccount): void {
  const list = loadRegistered().filter((a) => a.email.toLowerCase() !== norm(acc.email));
  list.push({ ...acc, email: acc.email.trim() });
  saveRegistered(list);
}
