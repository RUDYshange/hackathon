#!/usr/bin/env bash
# ==============================================================================
# Render build script — Royal Square CRM Django API
# Runs during each deploy's build phase. Environment variables (DATABASE_URL,
# DJANGO_SECRET_KEY, etc.) are available here.
# ==============================================================================
set -o errexit  # abort the build on the first error

pip install --upgrade pip
pip install -r requirements.txt

# Collect static assets so WhiteNoise can serve the Django admin + DRF
# browsable API in production.
python manage.py collectstatic --no-input

# Apply database migrations against the connected Postgres instance.
python manage.py migrate --no-input

# Seed sample records + shareable demo logins. Both commands are idempotent:
# seed_data no-ops if clients already exist, seed_auth upserts the demo users.
python manage.py seed_data
python manage.py seed_auth
