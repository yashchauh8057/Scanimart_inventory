#!/bin/sh
set -eu

export N8N_HOST="${N8N_HOST:-0.0.0.0}"
export N8N_PORT="${PORT:-${N8N_PORT:-10000}}"

if [ -n "${RENDER_EXTERNAL_URL:-}" ]; then
  export WEBHOOK_URL="${WEBHOOK_URL:-${RENDER_EXTERNAL_URL}/}"
  export N8N_EDITOR_BASE_URL="${N8N_EDITOR_BASE_URL:-${RENDER_EXTERNAL_URL}}"
fi

exec n8n start
