# syntax=docker/dockerfile:1
# =============================================================================
# Royal Square CRM — single combined image
# Stage 1 builds the React (Vite) SPA; stage 2 runs Django + gunicorn and serves
# that build as static files (same origin, no CORS). One container = whole app.
# =============================================================================

# ---------- Stage 1: build the React (Vite) SPA ----------
FROM node:20-bookworm-slim AS frontend
WORKDIR /app/royal-square-crm-react

# Install dependencies from a clean lockfile first (better layer caching).
COPY royal-square-crm-react/package.json royal-square-crm-react/package-lock.json ./
RUN npm ci

# Build. `vite build` uses base '/static/'; API is same-origin at /api.
COPY royal-square-crm-react/ ./
# Build-time frontend config. Render injects the service's environment variables
# as Docker build args with matching keys, so declaring these ARGs lets Vite
# inline them into the bundle. NOTE: any VITE_* value is embedded in the public
# JS bundle by design (it runs client-side), so restrict these keys by HTTP
# referrer / API restrictions in the Google Cloud console.
ARG VITE_GEMINI_API_KEY=""
ARG VITE_GOOGLE_MAPS_API_KEY=""
ENV VITE_API_BASE_URL=/api \
    VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY \
    VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY
RUN npm run build

# ---------- Stage 2: Django API + gunicorn (serves the SPA) ----------
FROM python:3.12-slim-bookworm AS app
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    DJANGO_SETTINGS_MODULE=config.settings
WORKDIR /app/royal-square-crm-django

# Python dependencies first (better layer caching).
COPY royal-square-crm-django/requirements.txt ./
RUN pip install --upgrade pip && pip install -r requirements.txt

# Backend source.
COPY royal-square-crm-django/ ./

# Bring in the built SPA at the path settings.py expects
# (BASE_DIR.parent / 'royal-square-crm-react' / 'dist').
COPY --from=frontend /app/royal-square-crm-react/dist /app/royal-square-crm-react/dist

# Collect static (SPA bundle + Django admin/DRF assets) into STATIC_ROOT so
# WhiteNoise can serve them. A dummy secret is only needed for this build step;
# no DB is touched by collectstatic.
RUN DJANGO_SECRET_KEY=build-only-not-used DJANGO_DEBUG=False DATABASE_URL= \
    python manage.py collectstatic --no-input

# Entrypoint migrates + seeds, then launches gunicorn.
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 8000
ENTRYPOINT ["/docker-entrypoint.sh"]
