#!/bin/sh
set -e

export CONTACT_PORT=3001

# Ensure DATA_DIR exists (volume may not create it)
mkdir -p "${DATA_DIR:-/data}"

# Seed funds.json from template if it doesn't exist or if it still has
# placeholder passwords (i.e. was seeded from the old CHANGE_ME template).
FUNDS_FILE="${DATA_DIR:-/data}/funds.json"
if [ ! -f "$FUNDS_FILE" ] || grep -q "CHANGE_ME" "$FUNDS_FILE" 2>/dev/null; then
  echo "[entrypoint] Seeding $FUNDS_FILE from template (first run or stale passwords)"
  cp /opt/contact-server/funds.template.json "$FUNDS_FILE"
fi

cd /opt/contact-server
DATA_DIR="${DATA_DIR:-/data}" PORT=$CONTACT_PORT node index.js &

envsubst '${PORT} ${UPSTREAM_API}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf
nginx -g 'daemon off;'
