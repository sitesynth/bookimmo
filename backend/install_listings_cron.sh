#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="${PROJECT_ROOT:-/home/ubuntu/bookimmo-backend}"
NODE_BIN="${NODE_BIN:-/usr/bin/node}"
LOG_FILE="${LOG_FILE:-/var/log/bookimmo-listings-refresh.log}"

SCRIPT_PATH="$PROJECT_ROOT/scripts/refresh-listings-cache.mjs"
if [[ ! -f "$SCRIPT_PATH" ]]; then
  echo "Listings refresh script not found: $SCRIPT_PATH" >&2
  exit 1
fi

CRON_JOB="*/15 * * * * cd $PROJECT_ROOT && $NODE_BIN scripts/refresh-listings-cache.mjs >> $LOG_FILE 2>&1"

CURRENT_CRON="$(crontab -l 2>/dev/null || true)"
if ! grep -Fq "scripts/refresh-listings-cache.mjs" <<< "$CURRENT_CRON"; then
  (printf '%s\n' "$CURRENT_CRON"; printf '%s\n' "$CRON_JOB") | crontab -
fi

echo "Installed listings refresh cron: $CRON_JOB"
