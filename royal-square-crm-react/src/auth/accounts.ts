// Demo login hints shown on the sign-in screen.
//
// These are shareable credentials for the hackathon build. Authentication is
// real (Django backend) — these accounts are seeded via `manage.py seed_auth`.
// The sign-in screen offers one-tap buttons that log in with these values.

import type { AccountRole } from './session';

export interface DemoAccount {
  role: AccountRole;
  name: string;
  email: string;
  password: string;
  blurb: string;
}

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
    name: 'Kagiso Mokoena',
    email: 'client@royalsquare.co.za',
    password: 'Client@2026',
    blurb: 'Client portal — existing family wealth portfolio from the database.',
  },
];
