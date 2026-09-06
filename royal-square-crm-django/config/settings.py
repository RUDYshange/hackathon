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
    'corsheaders',
    # Local apps
    'crm.apps.CrmConfig',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
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

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework Configuration (Secure Defaults)
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny', # Adjust to IsAuthenticated for protected endpoints
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

# CORS & CSRF Configuration
CORS_ALLOWED_ORIGINS = [
    orig.strip() for orig in os.getenv('CORS_ALLOWED_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173').split(',') if orig.strip()
]
CSRF_TRUSTED_ORIGINS = [
    orig.strip() for orig in os.getenv('CSRF_TRUSTED_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173').split(',') if orig.strip()
]

# Hardened Security Middleware Settings (Secure by Design)
SECURE_BROWSER_XSS_FILTER = os.getenv('SECURE_BROWSER_XSS_FILTER', 'True').lower() in ('true', '1')
SECURE_CONTENT_TYPE_NOSNIFF = os.getenv('SECURE_CONTENT_TYPE_NOSNIFF', 'True').lower() in ('true', '1')
X_FRAME_OPTIONS = os.getenv('X_FRAME_OPTIONS', 'DENY')
SESSION_COOKIE_HTTPONLY = os.getenv('SESSION_COOKIE_HTTPONLY', 'True').lower() in ('true', '1')
CSRF_COOKIE_HTTPONLY = os.getenv('CSRF_COOKIE_HTTPONLY', 'False').lower() in ('true', '1')
SESSION_COOKIE_SAMESITE = os.getenv('SESSION_COOKIE_SAMESITE', 'Lax')
CSRF_COOKIE_SAMESITE = os.getenv('CSRF_COOKIE_SAMESITE', 'Lax')
