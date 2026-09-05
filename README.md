# Royal Square CRM

A modern, full-stack wealth management & advisory CRM built with **Django 5 + Django REST Framework** on a **Neon PostgreSQL** database (backend) and **React 18 + TypeScript** (frontend).

---

## Architecture

```
royal-square-crm/
├── royal-square-crm-django/      # Django 5 + DRF + Neon PostgreSQL (Layered Architecture)
│   ├── config/                   # Project settings, URLs, WSGI
│   ├── crm/
│   │   ├── views/                # [Layer 1] DRF Presentation / Endpoints (+ assistant_views)
│   │   ├── services/             # [Layer 2] Business Logic, Math & POPIA Masking
│   │   │                         #           (+ assistant_service, assistant_tools — Groq voice agent)
│   │   ├── rules/                # [Rules Engine] Pluggable Compliance & Review Rules
│   │   ├── repositories/         # [Layer 3] Data Access Layer
│   │   ├── serializers/          # DRF DTOs & Validation
│   │   ├── models.py             # [Layer 4] Django ORM Database Entities
│   │   ├── migrations/           # Schema applied to Neon PostgreSQL
│   │   └── management/commands/  # seed_data — sample wealth management records
│   └── requirements.txt
│
└── royal-square-crm-react/       # React 18 + TypeScript + Vite (Hardened Frontend)
    ├── src/
    │   ├── components/
    │   │   ├── VoiceAssistant.tsx # Floating multilingual voice chatbot (all pages)
    │   │   ├── forms/            # DynamicForm, MaskedIdInput, CurrencyInput, Honeypot
    │   │   └── ui/               # Design system primitives
    │   ├── security/             # POPIA RSA ID Luhn check, XSS sanitizer, CSRF locks
    │   ├── schemas/              # Zod validation & Server-Driven UI types
    │   ├── services/             # API client with CSRF and idempotency keys
    │   └── views/                # Portfolio, Secure Form, SDUI Engine, Claims, Reminders
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

### Neon Database

The backend connects **exclusively** to a Neon PostgreSQL database — there is no
local SQLite fallback. Copy the connection string from the Neon Console >
Connect and set it as `DATABASE_URL` in `royal-square-crm-django/.env`. Use the
pooled endpoint (host contains `-pooler`) for the running app. Neon requires
TLS, so `sslmode=require` is enforced automatically:

```dotenv
DATABASE_URL=postgresql://<user>:<password>@ep-xxxx-pooler.<region>.aws.neon.tech/<db>?sslmode=require&channel_binding=require
DB_SSLMODE=require
DB_CONN_MAX_AGE=600
```

Then apply the Django schema and seed sample data into Neon:

```bash
cd royal-square-crm-django
./venv/bin/python manage.py migrate
./venv/bin/python manage.py seed_data
```

The database is reached only through the Django API — the React frontend never
connects to Neon directly, so no database credentials belong in the frontend
environment.

---

## Manual Execution (Without Make)
```bash
cd royal-square-crm-django
python3 -m venv venv
./venv/bin/pip install -r requirements.txt
./venv/bin/python manage.py migrate      # Applies schema to Neon PostgreSQL
./venv/bin/python manage.py seed_data    # Seeds sample CRM records into Neon
./venv/bin/python manage.py runserver 127.0.0.1:8000
```
- API Health: `http://localhost:8000/api/health`
- Django Admin: `http://localhost:8000/admin`

### 2. Start the React Frontend
```bash
cd royal-square-crm-react
npm install
npm run dev
```
- Web Application: `http://localhost:5173` (proxies `/api` directly to port 8000)

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

## Security & Compliance Highlights
- **POPIA Protection**: Field-level masking on RSA ID numbers (`900101 **** ***`) with real-time Luhn checksum validation.
- **Server-Driven UI (SDUI)**: Forms render dynamically based on JSON schemas emitted by the Python backend without hardcoded frontend form code.
- **Anti-Bot & Anti-Tampering**: Invisible honeypot traps and in-flight submission idempotency locks.
- **Financial Math**: Scale-2 decimal compliance for asset/liability grouping, surplus calculations, and debt-to-asset ratios.