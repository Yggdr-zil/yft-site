#!/bin/sh
set -e

export CONTACT_PORT=3001

# Ensure DATA_DIR exists (volume may not create it)
mkdir -p "${DATA_DIR:-/data}"

# Always seed funds.json from template on startup — template is source of truth.
# Passwords are baked into the template; no manual editing needed in production.
FUNDS_FILE="${DATA_DIR:-/data}/funds.json"
TEMPLATE="/opt/contact-server/funds.template.json"
TEMPLATE_VER=$(grep -o '"_version"[^,]*' "$TEMPLATE" 2>/dev/null || echo "")
CURRENT_VER=$(grep -o '"_version"[^,]*' "$FUNDS_FILE" 2>/dev/null || echo "")
if [ ! -f "$FUNDS_FILE" ] || [ "$TEMPLATE_VER" != "$CURRENT_VER" ]; then
  echo "[entrypoint] Seeding $FUNDS_FILE from template (version: $TEMPLATE_VER)"
  cp "$TEMPLATE" "$FUNDS_FILE"
fi

cd /opt/contact-server
DATA_DIR="${DATA_DIR:-/data}" PORT=$CONTACT_PORT node index.js &

envsubst '${PORT} ${UPSTREAM_API}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf
nginx -g 'daemon off;'
