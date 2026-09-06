"""Django settings for Royal Square CRM — Secure by Design."""
from pathlib import Path
import os
import dj_database_url
from dotenv import load_dotenv
from urllib.parse import parse_qs, urlparse

BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment configuration from .env
load_dotenv(BASE_DIR / '.env')

# Core Security Configurations
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY')
if not SECRET_KEY:
    raise ValueError("CRITICAL SECURITY ERROR: DJANGO_SECRET_KEY must be set in .env")

DEBUG = os.getenv('DJANGO_DEBUG', 'False').lower() in ('true', '1')

ALLOWED_HOSTS = [h.strip() for h in os.getenv('DJANGO_ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',') if h.strip()]

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third-party apps
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    # Local apps
    'crm.apps.CrmConfig',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    # WhiteNoise serves static files (Django admin + DRF browsable API) in
    # production where gunicorn/Render does not serve them itself. Must sit
    # directly after SecurityMiddleware.
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# Database Configuration — Neon / Supabase PostgreSQL with SQLite fallback.
# Resolution order:
#   1. DATABASE_URL          — single connection string (Neon), parsed by dj_database_url.
#   2. DB_URL/DB_USER/DB_PASSWORD — split credentials (Supabase / JDBC style).
#   3. SQLite                — local development fallback when nothing else is set.
DATABASE_URL = os.getenv('DATABASE_URL') or os.getenv('SUPABASE_DB_URL')
DB_URL = os.getenv('DB_URL')
DB_USER = os.getenv('DB_USER')
DB_PASSWORD = os.getenv('DB_PASSWORD')
DB_SSLMODE = os.getenv('DB_SSLMODE', 'require')

if DATABASE_URL:
    normalized_database_url = DATABASE_URL.removeprefix('jdbc:')
    DATABASES = {
        'default': dj_database_url.parse(
            normalized_database_url,
            conn_max_age=int(os.getenv('DB_CONN_MAX_AGE', '600')),
            conn_health_checks=True,
            ssl_require=True,
        )
    }
elif DB_URL and DB_USER and DB_PASSWORD:
    normalized_db_url = DB_URL.removeprefix('jdbc:')
    parsed_db_url = urlparse(normalized_db_url)
    db_query = parse_qs(parsed_db_url.query)
    sslmode = db_query.get('sslmode', [DB_SSLMODE])[0]
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': parsed_db_url.path.lstrip('/') or 'postgres',
            'USER': DB_USER,
            'PASSWORD': DB_PASSWORD,
            'HOST': parsed_db_url.hostname,
            'PORT': parsed_db_url.port or 5432,
            'CONN_MAX_AGE': int(os.getenv('DB_CONN_MAX_AGE', '600')),
            'CONN_HEALTH_CHECKS': True,
            'OPTIONS': {
                'sslmode': sslmode,
            },
        }
    }
else:
    DATABASE_NAME = os.getenv('DATABASE_NAME', 'royalsquare.sqlite3')
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / DATABASE_NAME,
            'OPTIONS': {
                'timeout': 20,
            }
        }
    }

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 12}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-za'
TIME_ZONE = 'Africa/Johannesburg'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# --------------------------------------------------------------------------- #
# Combined app: serve the built React (Vite) SPA from Django
# --------------------------------------------------------------------------- #
# The frontend is built with base '/static/', so its assets live under
# STATIC_URL. We add the build directory to STATICFILES_DIRS so collectstatic
# (production) and the dev server both serve /static/assets/*. index.html is
# served by the SPA view in config/urls.py.
FRONTEND_DIST = (BASE_DIR.parent / 'royal-square-crm-react' / 'dist').resolve()
FRONTEND_INDEX = FRONTEND_DIST / 'index.html'
STATICFILES_DIRS = [FRONTEND_DIST] if FRONTEND_DIST.is_dir() else []

# WhiteNoise: compress collected static files and serve them from gunicorn.
# We use the non-manifest storage because Vite already content-hashes its
# output filenames; the manifest backend would try to re-hash and rewrite
# references inside the bundle, which is unnecessary and can break collectstatic.
STORAGES = {
    'default': {
        'BACKEND': 'django.core.files.storage.FileSystemStorage',
    },
    'staticfiles': {
        'BACKEND': 'whitenoise.storage.CompressedStaticFilesStorage',
    },
}

WHITENOISE_USE_FINDERS = True
WHITENOISE_AUTOREFRESH = True

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework Configuration (Secure Defaults)
REST_FRAMEWORK = {
    # Token auth for the SPA. Requests that carry "Authorization: Token <key>"
    # are authenticated as their user; anonymous requests are still allowed
    # except on endpoints that explicitly require authentication (e.g. portal).
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny', # Per-view IsAuthenticated where needed
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '1000/day',
        'user': '10000/day',
    },
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ]
}

# Voice Assistant (Groq) — server-side only.
# One key powers speech-to-text (Whisper) and the tool-calling agent brain
# (Llama 3.3 70B) for the multilingual voice chatbot.
GROQ_API_KEY = os.getenv('GROQ_API_KEY', '')
GROQ_WHISPER_MODEL = os.getenv('GROQ_WHISPER_MODEL', 'whisper-large-v3')
GROQ_AGENT_MODEL = os.getenv('GROQ_AGENT_MODEL', 'openai/gpt-oss-120b')
# When False, the assistant is restricted to read-only tools.
ASSISTANT_ENABLE_WRITE_ACTIONS = os.getenv('ASSISTANT_ENABLE_WRITE_ACTIONS', 'True').lower() in ('true', '1')

# Client portal: which seeded client the customer dashboard shows when the
# account isn't linked to a specific client record yet.
PORTAL_DEFAULT_CLIENT_REFERENCE = os.getenv('PORTAL_DEFAULT_CLIENT_REFERENCE', 'CLI-1026')

# CORS & CSRF Configuration
CORS_ALLOWED_ORIGINS = [
    orig.strip() for orig in os.getenv('CORS_ALLOWED_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173').split(',') if orig.strip()
]
CSRF_TRUSTED_ORIGINS = [
    orig.strip() for orig in os.getenv('CSRF_TRUSTED_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173').split(',') if orig.strip()
]

# The React client attaches custom headers to every request (see secureFetch in
# the frontend). They must be allowed by CORS or the browser's preflight blocks
# every cross-origin API call. django-cors-headers only permits a standard set
# by default, so we extend it with the app's custom headers.
from corsheaders.defaults import default_headers  # noqa: E402
CORS_ALLOW_HEADERS = list(default_headers) + [
    'x-csrf-token',
    'x-idempotency-key',
]

# Hardened Security Middleware Settings (Secure by Design)
SECURE_BROWSER_XSS_FILTER = os.getenv('SECURE_BROWSER_XSS_FILTER', 'True').lower() in ('true', '1')
SECURE_CONTENT_TYPE_NOSNIFF = os.getenv('SECURE_CONTENT_TYPE_NOSNIFF', 'True').lower() in ('true', '1')
X_FRAME_OPTIONS = os.getenv('X_FRAME_OPTIONS', 'DENY')
SESSION_COOKIE_HTTPONLY = os.getenv('SESSION_COOKIE_HTTPONLY', 'True').lower() in ('true', '1')
CSRF_COOKIE_HTTPONLY = os.getenv('CSRF_COOKIE_HTTPONLY', 'False').lower() in ('true', '1')
SESSION_COOKIE_SAMESITE = os.getenv('SESSION_COOKIE_SAMESITE', 'Lax')
CSRF_COOKIE_SAMESITE = os.getenv('CSRF_COOKIE_SAMESITE', 'Lax')

# --------------------------------------------------------------------------- #
# Render / production hosting
# --------------------------------------------------------------------------- #
# Render injects RENDER_EXTERNAL_HOSTNAME (e.g. royal-square-crm-api.onrender.com)
# at runtime. Trust it automatically so the deploy works without hard-coding the
# generated host in DJANGO_ALLOWED_HOSTS / CSRF_TRUSTED_ORIGINS.
RENDER_EXTERNAL_HOSTNAME = os.getenv('RENDER_EXTERNAL_HOSTNAME')
if RENDER_EXTERNAL_HOSTNAME:
    if RENDER_EXTERNAL_HOSTNAME not in ALLOWED_HOSTS:
        ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)
    render_origin = f'https://{RENDER_EXTERNAL_HOSTNAME}'
    if render_origin not in CSRF_TRUSTED_ORIGINS:
        CSRF_TRUSTED_ORIGINS.append(render_origin)

# Behind Render's load balancer, requests reach Django over HTTP with the
# original scheme in X-Forwarded-Proto. Trust it so request.is_secure(),
# secure cookies and CSRF referer checks behave correctly over HTTPS.
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SESSION_COOKIE_SECURE = os.getenv('SESSION_COOKIE_SECURE', 'True').lower() in ('true', '1')
    CSRF_COOKIE_SECURE = os.getenv('CSRF_COOKIE_SECURE', 'True').lower() in ('true', '1')
    # Opt-in HTTP->HTTPS redirect. Left off by default so Render's internal
    # health check (which may hit the service over HTTP) is not redirected.
    SECURE_SSL_REDIRECT = os.getenv('SECURE_SSL_REDIRECT', 'False').lower() in ('true', '1')
    SECURE_HSTS_SECONDS = int(os.getenv('SECURE_HSTS_SECONDS', '0'))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = os.getenv('SECURE_HSTS_INCLUDE_SUBDOMAINS', 'False').lower() in ('true', '1')
    SECURE_HSTS_PRELOAD = os.getenv('SECURE_HSTS_PRELOAD', 'False').lower() in ('true', '1')
