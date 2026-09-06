#!/usr/bin/env bash
# =============================================================================
# Container start: apply DB migrations, seed (idempotent), then serve.
# Runs on every deploy so the database schema is always up to date.
# =============================================================================
set -e

cd /app/royal-square-crm-django

echo "==> Applying database migrations..."
python manage.py migrate --no-input

echo "==> Seeding database (idempotent)..."
python manage.py seed_data || echo "seed_data skipped/failed (non-fatal)"
python manage.py seed_auth || echo "seed_auth skipped/failed (non-fatal)"

echo "==> Starting gunicorn on port ${PORT:-8000}..."
exec gunicorn config.wsgi:application \
    --bind "0.0.0.0:${PORT:-8000}" \
    --workers "${WEB_CONCURRENCY:-2}" \
    --timeout 120
