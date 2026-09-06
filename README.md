# Royal Square CRM

A modern, full-stack wealth management & advisory CRM built with **Django 5 + Django REST Framework** on a **Neon PostgreSQL** database (primary backend), an alternative **FastAPI + SQLite** implementation, and **React 18 + TypeScript** (frontend).

The React app opens on a **landing page** where users sign in or sign up. On sign-up they choose to register as a **Customer** or a **Business**, which routes them into one of two workspaces:

- **Customer → Client portal** — a soft, high-contrast wealth dashboard designed for clients aged 60+, with guided "Report Motor Accident" and "Report Loss / Theft" journeys.
- **Business → Advisory console** — the institutional, staff-facing CRM (Client 360, claims pipeline, compliance & SLAs, product providers, reminders, onboarding, SDUI form engine).

Two flagship inclusivity features are available on **every page** of both workspaces:

- **Multilingual voice agent** — speak to the CRM in any South African language (Groq Whisper + a tool-calling agent).
- **Whole-app translation** — a one-tap language switcher translates the entire interface into any of the **11 official SA languages**.

---

## Architecture

```
royal-square-crm/
├── royal-square-crm-django/      # Django 5 + DRF + Neon PostgreSQL — PRIMARY backend (used by `make run`)
│   ├── config/                   # Project settings, URLs, WSGI
│   ├── crm/
│   │   ├── views/                # [Layer 1] DRF Presentation / Endpoints (+ assistant_views — voice agent)
│   │   ├── services/             # [Layer 2] Business Logic, Math & POPIA Masking
│   │   │                         #           (+ assistant_service, assistant_tools — Groq voice agent)
│   │   ├── rules/                # [Rules Engine] Pluggable Compliance & Review Rules
│   │   ├── repositories/         # [Layer 3] Django ORM Data Access Layer
│   │   ├── serializers/          # DRF DTOs & Validation
│   │   ├── models.py             # [Layer 4] Django ORM Database Entities
│   │   └── management/commands/  # seed_data — sample wealth management records
│   └── requirements.txt
│
├── royal-square-crm-python/      # Python 3.12 + FastAPI + SQLite — alternative backend implementation
│   └── app/                      # routers / services / rules / repositories / models / schemas
│
└── royal-square-crm-react/       # React 18 + TypeScript + Vite (Hardened Frontend)
    ├── index.html                # Loads Tailwind (CDN) for the client portal + Google fonts
    ├── src/
    │   ├── App.tsx               # Top-level router: landing → auth → client portal | advisor console
    │   ├── main.tsx              # Wraps <App/> in <I18nProvider/> (whole-app translation)
    │   ├── auth/                 # LandingPage, AuthView (sign in / sign up), session helper
    │   ├── advisor/              # AdvisorConsole — the institutional staff CRM workspace
    │   ├── i18n/                 # I18nProvider (auto-translates the UI) + 11 SA languages
    │   ├── client/               # Client-portal module (context, components, mock data, types)
    │   ├── components/
    │   │   ├── VoiceAssistant.tsx # Floating multilingual voice chatbot (all pages)
    │   │   ├── forms/            # DynamicForm, MaskedIdInput, CurrencyInput, Honeypot
    │   │   └── maps/             # Accident location map
    │   ├── security/             # POPIA RSA ID Luhn check, XSS sanitizer, CSRF locks
    │   ├── schemas/              # Zod validation & Server-Driven UI types
    │   ├── services/             # API client with CSRF and idempotency keys
    │   └── views/                # ClientDashboardView, AccidentReportPageView,
    │                             #   ReportLossPageView, SettingsView (language picker),
    │                             #   plus the institutional CRM views (Clients, Claims, …)
    └── package.json
```

---

## Quickstart with Makefile

To run the entire app locally with a single command:

```bash
make run              # Runs both Django (:8000) and React (:5173) locally
```

*(If it is your first time running, `make run` automatically creates virtual environments, installs dependencies, runs migrations, and seeds sample data.)*

### Other Useful Make Commands:

```bash
make help             # View all available make commands
make run-backend      # Run only the Django REST API on http://localhost:8000
make run-frontend     # Run only the React Vite frontend on http://localhost:5173
make migrate          # Run database migrations
make seed             # Re-seed database with sample records
make check            # Run Django security checks and React build verification
make clean            # Remove build caches and pycache
```

### Supabase Database

The Django backend uses local SQLite by default. To use a Supabase PostgreSQL
database, copy the connection string from Supabase Dashboard > Connect and set
`DATABASE_URL` (or `SUPABASE_DB_URL`) in `royal-square-crm-django/.env`:

```dotenv
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
SUPABASE_URL=https://[PROJECT_REF].supabase.co
SUPABASE_ANON_KEY=[PUBLIC_ANON_KEY]
```

Then apply the Django schema to Supabase:

```bash
cd royal-square-crm-django
./venv/bin/python manage.py migrate
```

Keep the Supabase service-role key out of both the repository and the React
environment. The React app may use only the public anon key if direct Supabase
client access is added later.

---

## Manual Execution (Without Make)

### 1. Start the Django REST API (primary backend)
```bash
cd royal-square-crm-django
python3 -m venv venv
./venv/bin/pip install -r requirements.txt
cp .env.example .env              # then set GROQ_API_KEY (and DATABASE_URL for Postgres)
./venv/bin/python manage.py migrate
./venv/bin/python manage.py seed_data   # sample South African wealth-management records
./venv/bin/python manage.py runserver 127.0.0.1:8000
```
- API Health: `http://localhost:8000/api/health`

> Alternative FastAPI + SQLite backend: `cd royal-square-crm-python`, install
> `requirements.txt`, run `python -m app.seed`, then
> `uvicorn app.main:app --port 8000` (Swagger at `/docs`).

### 2. Start the React Frontend
```bash
cd royal-square-crm-react
npm install
cp .env.example .env              # sets VITE_API_BASE_URL etc.
npm run dev
```
- Web Application: `http://localhost:5173` (talks to the API via `VITE_API_BASE_URL`)

---

## Landing Page & Sign In / Sign Up

The app opens on a dark, premium **landing page** (`src/auth/LandingPage.tsx`)
that follows the "Enterprise Gateway" pattern — a clear *path selection* between
the two audiences, with trust signals throughout. Its visual direction (dark
navy + brand gold, IBM Plex Sans, standard entrance motion, accessible focus
states) was generated with the
[ui-ux-pro-max design skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill).
*(Design guidance was applied and adapted for this project.)*

- **Sign in** — email + password, with a Customer / Business selector.
- **Sign up** — choose to register as a **Customer** or a **Business**, then set
  up access. The choice determines which workspace you land in.

```
Landing → Sign in / Sign up
   ├─ Customer  → Client portal   (src/views/ClientDashboardView.tsx)
   └─ Business  → Advisory console (src/advisor/AdvisorConsole.tsx)
```

The chosen workspace is remembered on the device and restored on reload; a
**Sign out** control in each workspace invalidates the token and returns to the
landing page.

### Authentication (database-backed)

Auth is real and persisted in the database — Django users + DRF tokens, with an
`Account` model linking each login to its role and (for customers) their
`Client` record:

| Endpoint | Purpose |
|---|---|
| `POST /api/auth/register` | Create a user. For **customers** this also creates a **fresh Client** seeded only with the name/email given. |
| `POST /api/auth/login` | Verify credentials, return `{ token, role, name, email, clientId }`. |
| `GET /api/auth/me` | Resolve the current (token-authenticated) account. |
| `POST /api/auth/logout` | Invalidate the caller's token. |

- **New customer sign-up → fresh dashboard.** A new Client is created from the
  details supplied, so the portal starts empty (R0 net worth, no goals) under
  the user's own name — and the client immediately appears in the advisory
  console's register.
- **Existing user → their data.** Sign-in resolves the linked Client and the
  portal renders that client's persisted figures.
- The SPA stores the token (`src/auth/session.ts`) and `secureFetch` attaches
  `Authorization: Token <key>` to every request. `GET /api/portal/overview`
  requires authentication and is resolved per-user (never a shared default).

Seed the shareable demo logins with:

```bash
cd royal-square-crm-django && ./venv/bin/python manage.py seed_auth
```

This creates `advisor@royalsquare.co.za` (business) and
`client@royalsquare.co.za` (customer, linked to an existing populated client).

> Single-practice model: all advisers see all clients (customers self-onboard
> into the shared register). Multi-tenant practice isolation is a future step.

---

## Accessible Client Portal (customer workspace)

The customer workspace is a client-facing wealth dashboard (`ClientDashboardView`)
built for clarity and for clients aged 60+:

- **Comfort bar** — one-tap text scaling (A / A+ / A++), a high-contrast toggle,
  and the **language switcher** (all 11 SA languages), rendered with Tailwind.
- **Wealth overview** — net worth, investments and fixed assets, advisor-loaded
  goals with progress, and automated reminders (renewals, reviews, certificates).
- **Guided claim journeys** — "Report Motor Accident" (`AccidentReportPageView`,
  with map + witness/other-party capture) and "Report Loss / Theft"
  (`ReportLossPageView`), reachable from the header.
- **Accessibility** — skip link, ARIA roles/labels, focus-visible rings, live
  region for toasts.

Styling: the portal uses **Tailwind via CDN** (configured in `index.html`); the
voice assistant and design-system components use the CSS tokens in
`src/index.css`. Both stylesheets coexist.

The institutional staff CRM (Clients, Claims, Compliance, Providers, Reminders,
Onboarding, SDUI form engine) is the **advisory console** — see below. Both
workspaces are live and reachable from the landing page.

---

## Advisory Console (business workspace)

Businesses/advisers land in `src/advisor/AdvisorConsole.tsx`, the institutional
CRM with a left navigation rail:

- **Dashboard (The Desk)**, **Clients & Portfolios** (Client 360), **Claims
  Management** (pipeline + incident hub), **Compliance & SLAs**, **Reminders &
  Reviews**, and **Product Providers**.
- **Servicing** — client onboarding and the server-driven form engine.
- The **voice agent** is docked here too, with full CRM tool-calling
  (list/search clients, register/advance claims, dismiss reminders, etc.).

---

## Multilingual Voice Assistant

A floating assistant is available on **every page** of the app (the gold button
in the bottom-right corner). Advisers can speak to the CRM in **any South
African language** — the assistant transcribes the speech, understands the
request, performs the action, and replies in the same language.

### Pipeline

```
🎙️ Speech (any SA language)
   → Groq Whisper (speech-to-text)                    [Django backend]
   → Groq Llama-class agent with CRM tool definitions [Django backend]
        → decides which CRM tool to call (clients / claims / reminders)
        → executes it through the existing crm/services layer
   → reply written back in the user's language        [rendered in the chat bubble]
```

Everything runs through **one provider (Groq)** and a single server-side key —
no GPU, no per-request infrastructure. Audio is sent to the Django API; the Groq
key never reaches the browser.

### What it can do

Read: list/search clients, open a client profile, list claims, open a claim,
list open compliance reminders. Write: onboard a client, register a claim,
advance a claim through the pipeline, toggle scene-evidence checklist items, and
dismiss reminders. Write actions can be disabled with a single flag
(`ASSISTANT_ENABLE_WRITE_ACTIONS=False`) for a read-only assistant.

Example prompts (spoken or typed):
- English: “How many open claims do we have?”
- Afrikaans: “Wys my Sipho se profiel.”
- isiZulu: “Zingaki izimangalo esizivulile?”

### Configuration

The assistant is configured entirely in `royal-square-crm-django/.env`:

```dotenv
# Get a free key at https://console.groq.com
GROQ_API_KEY=your-groq-key
GROQ_WHISPER_MODEL=whisper-large-v3
GROQ_AGENT_MODEL=openai/gpt-oss-120b
ASSISTANT_ENABLE_WRITE_ACTIONS=True
```

The endpoint is `POST /api/assistant/voice` — it accepts either an `audio`
file (multipart) or a `text` message (JSON), plus optional conversation
`history`, and returns `{ transcript, language, reply, actions }`.

> Microphone capture requires a secure context. It works on `localhost` during
> development; a deployed demo must be served over HTTPS for the mic to work.

---

## Whole-App Multilingual Translation

Beyond the voice agent, the **entire interface** can be switched into any of
South Africa's 11 official languages from the language picker in the dashboard
comfort bar. Pick a language and every visible label, heading, button and
placeholder is translated in place.

### How it works

```
Language selected (e.g. isiZulu)
   → I18nProvider walks the rendered DOM (text nodes + placeholder/title attrs)
   → batches untranslated strings → POST /api/i18n/translate                [Django]
        → Groq translates them (proper nouns, codes & amounts left as-is)
   → results cached in localStorage per language, applied in place
   → a MutationObserver + periodic re-scan keep late-rendered content translated
```

- **Cached** — each unique string is translated once per language, so switching
  back is instant and repeat visits are cheap.
- **Safe by design** — client names, reference codes (e.g. `FSP 29370`),
  numbers and currency are never translated; elements marked
  `data-no-translate` (and `SCRIPT`/`STYLE`/`CODE`/`SVG`) are skipped.
- **English is the source** — selecting English restores the original copy.

Endpoint: `POST /api/i18n/translate` with `{ "target": "isiZulu", "texts": [...] }`
returns `{ "target": "isiZulu", "translations": { "<original>": "<translated>" } }`.
It reuses the same Groq client and `GROQ_AGENT_MODEL` as the voice agent, so no
extra configuration is required beyond `GROQ_API_KEY`.

---

## Security & Compliance Highlights
- **POPIA Protection**: Field-level masking on RSA ID numbers (`900101 **** ***`) with real-time Luhn checksum validation.
- **Server-Driven UI (SDUI)**: Forms render dynamically based on JSON schemas emitted by the Python backend without hardcoded frontend form code.
- **Anti-Bot & Anti-Tampering**: Invisible honeypot traps and in-flight submission idempotency locks.
- **Financial Math**: Scale-2 decimal compliance for asset/liability grouping, surplus calculations, and debt-to-asset ratios.