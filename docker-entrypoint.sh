#!/bin/sh
set -e

export CONTACT_PORT=3001

# Ensure DATA_DIR exists (volume may not create it)
mkdir -p "${DATA_DIR:-/data}"

# Copy template if funds.json doesn't already exist in DATA_DIR
FUNDS_FILE="${DATA_DIR:-/data}/funds.json"
if [ ! -f "$FUNDS_FILE" ]; then
  echo "[entrypoint] No funds.json found — copying template to $FUNDS_FILE"
  echo "[entrypoint] !! Fill in real passwords before sending VC links !!"
  cp /opt/contact-server/funds.template.json "$FUNDS_FILE"
fi

cd /opt/contact-server
DATA_DIR="${DATA_DIR:-/data}" PORT=$CONTACT_PORT node index.js &

envsubst '${PORT} ${UPSTREAM_API}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf
nginx -g 'daemon off;'
