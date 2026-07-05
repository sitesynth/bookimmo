#!/usr/bin/env bash
set -euo pipefail

DB_NAME="${DB_NAME:-bookimmo_backend}"
DB_USER="${DB_USER:-bookimmo_backend}"
DB_PASSWORD="${DB_PASSWORD:-BookimmoBackend_2026!}"
SCHEMA_PATH="${SCHEMA_PATH:-$(cd "$(dirname "$0")" && pwd)/bookimmo_backend_schema.sql}"

sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib
sudo systemctl enable --now postgresql

sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASSWORD}';"

sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"

sudo -u postgres psql -d "${DB_NAME}" -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"

psql "postgresql://${DB_USER}:${DB_PASSWORD}@127.0.0.1:5432/${DB_NAME}" -f "${SCHEMA_PATH}"

cat <<INFO
PostgreSQL backend storage is ready.

Use these backend/.env values:
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
INFO
