#!/bin/sh
set -e

export CONTACT_PORT=3001

# Ensure DATA_DIR exists (volume may not create it)
mkdir -p "${DATA_DIR:-/data}"

# ── Seed / merge funds.json from template ─────────────────────────────────────
# Template is source of truth for initial funds + passwords.
# On version bump, merge: template entries overwrite existing, but dynamically
# added funds (via admin API) are preserved.
FUNDS_FILE="${DATA_DIR:-/data}/funds.json"
TEMPLATE="/opt/contact-server/funds.template.json"
TEMPLATE_VER=$(grep -o '"_version"[^,]*' "$TEMPLATE" 2>/dev/null || echo "")
CURRENT_VER=$(grep -o '"_version"[^,]*' "$FUNDS_FILE" 2>/dev/null || echo "")
if [ ! -f "$FUNDS_FILE" ]; then
  echo "[entrypoint] Seeding $FUNDS_FILE from template (version: $TEMPLATE_VER)"
  cp "$TEMPLATE" "$FUNDS_FILE"
elif [ "$TEMPLATE_VER" != "$CURRENT_VER" ]; then
  echo "[entrypoint] Merging template into $FUNDS_FILE (${CURRENT_VER} -> ${TEMPLATE_VER})"
  node -e "
    const fs = require('fs');
    const tmpl = JSON.parse(fs.readFileSync('$TEMPLATE', 'utf8'));
    const curr = JSON.parse(fs.readFileSync('$FUNDS_FILE', 'utf8'));
    const merged = { ...curr, ...tmpl };
    fs.writeFileSync('$FUNDS_FILE', JSON.stringify(merged, null, 2));
  "
fi

# ── Persist deck + portal templates in /data/templates/ ───────────────────────
# These are needed for dynamic portal/deck rendering at runtime.
# Copied from build artifacts on every startup so they stay current with deploys.
TDIR="${DATA_DIR:-/data}/templates"
mkdir -p "$TDIR/decks"

# Copy the 4 standalone deck files (with auth gates already injected by build)
cp /usr/share/nginx/html/contrary-deck/index.html "$TDIR/decks/founder-first.html" 2>/dev/null || true
cp /usr/share/nginx/html/1517-deck/index.html "$TDIR/decks/founder-first-1517.html" 2>/dev/null || true
cp /usr/share/nginx/html/industry-ventures-deck/index.html "$TDIR/decks/founder-first-iv.html" 2>/dev/null || true
cp /usr/share/nginx/html/qed-deck/index.html "$TDIR/decks/market-first.html" 2>/dev/null || true

# Copy portal template (has __FUND_ID__, __FUND_NAME__, __DECK_PATH__ placeholders)
cp /opt/contact-server/investor-portal.html "$TDIR/portal-template.html" 2>/dev/null || true

# Copy latest PDFs into nginx docs dir (overrides any stale build-cached copies)
cp /opt/contact-server/docs/*.pdf /usr/share/nginx/html/docs/ 2>/dev/null || true

echo "[entrypoint] Templates ready: $(ls "$TDIR/decks/" 2>/dev/null | wc -l) decks, portal-template"

cd /opt/contact-server
DATA_DIR="${DATA_DIR:-/data}" PORT=$CONTACT_PORT node index.js &

envsubst '${PORT} ${UPSTREAM_API}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf
nginx -g 'daemon off;'
