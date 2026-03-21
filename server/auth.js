import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Data directory (mount a volume here in production) ─────────────────────
const DATA_DIR = process.env.DATA_DIR || __dirname;
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

const FUNDS_FILE     = join(DATA_DIR, 'funds.json');
const SESSIONS_FILE  = join(DATA_DIR, 'sessions.json');
const TELEMETRY_FILE = join(DATA_DIR, 'telemetry.ndjson');

// ── Fund credentials ────────────────────────────────────────────────────────
// Re-read on every auth check so that editing funds.json revokes access live.
function loadFunds() {
  try { return JSON.parse(readFileSync(FUNDS_FILE, 'utf8')); }
  catch { return {}; }
}

// ── Session store (in-memory + persisted to disk) ──────────────────────────
const sessions = new Map();

function loadSessions() {
  try {
    const data = JSON.parse(readFileSync(SESSIONS_FILE, 'utf8'));
    for (const [token, sess] of Object.entries(data)) sessions.set(token, sess);
    console.log(`[auth] Restored ${sessions.size} sessions from disk`);
  } catch { /* fresh start — no sessions file yet */ }
}

function saveSessions() {
  const obj = {};
  for (const [k, v] of sessions) obj[k] = v;
  try { writeFileSync(SESSIONS_FILE, JSON.stringify(obj, null, 2), 'utf8'); }
  catch (e) { console.error('[auth] Failed to persist sessions:', e.message); }
}

loadSessions();

// ── Auth API ────────────────────────────────────────────────────────────────

/**
 * Attempt login. Returns session object on success, null on failure.
 */
export function login(username, password, ip) {
  const funds = loadFunds();
  const fund = funds[username];
  if (!fund || !fund.active || fund.password !== password) return null;

  const token = randomBytes(32).toString('hex');
  const sess = {
    fundId:    username,
    fundName:  fund.name || username,
    loginTime: Date.now(),
    ip:        ip || 'unknown',
  };
  sessions.set(token, sess);
  saveSessions();
  logEvent({ fund: username, event: 'login', ip });
  return { token, fundId: username, fundName: sess.fundName };
}

/**
 * Validate a token. Returns session if valid, null if missing or revoked.
 */
export function validateToken(token) {
  if (!token) return null;
  const sess = sessions.get(token);
  if (!sess) return null;

  // Re-check fund active status on every call — enables live revocation.
  const funds = loadFunds();
  const fund = funds[sess.fundId];
  if (!fund || !fund.active) {
    sessions.delete(token);
    saveSessions();
    return null;
  }
  return sess;
}

/**
 * Revoke all sessions for a given fund slug.
 */
export function revokeByFund(fundId) {
  let removed = 0;
  for (const [token, sess] of sessions) {
    if (sess.fundId === fundId) { sessions.delete(token); removed++; }
  }
  if (removed > 0) saveSessions();
  return removed;
}

// ── Fund management ──────────────────────────────────────────────────────────

const VALID_DECK_TYPES = ['founder-first', 'founder-first-1517', 'founder-first-iv', 'market-first'];

/**
 * Create a new fund. Returns the fund object on success, or { error } on failure.
 */
export function addFund(name, deckType) {
  if (!name || !deckType) return { error: 'name and deckType required' };
  if (!VALID_DECK_TYPES.includes(deckType)) return { error: `Invalid deckType. Must be one of: ${VALID_DECK_TYPES.join(', ')}` };

  const fundId = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (!fundId) return { error: 'Could not generate a valid fund ID from name' };

  const funds = loadFunds();
  if (funds[fundId]) return { error: 'Fund already exists', fundId };

  const suffix = randomBytes(2).toString('hex').slice(0, 3);
  const password = `ygg2026-${suffix}`;

  funds[fundId] = { name, password, active: true, deckType };
  try { writeFileSync(FUNDS_FILE, JSON.stringify(funds, null, 2), 'utf8'); }
  catch (e) { return { error: 'Failed to write funds file: ' + e.message }; }

  return { fundId, name, password, deckType, portalUrl: `/portal/${fundId}/` };
}

/**
 * Return all funds (excluding meta keys like _readme, _version).
 */
export function getFunds() {
  const funds = loadFunds();
  return Object.entries(funds)
    .filter(([k]) => !k.startsWith('_'))
    .map(([id, f]) => ({
      id,
      name: f.name,
      password: f.password,
      active: f.active,
      deckType: f.deckType || 'founder-first',
    }));
}

// ── Admin auth ──────────────────────────────────────────────────────────────

export function validateAdmin(username, password) {
  const adminUser = process.env.ADMIN_USER || 'admin';
  const adminPass = process.env.ADMIN_PASS || '';
  if (!adminPass) return false; // No admin access if ADMIN_PASS not set
  return username === adminUser && password === adminPass;
}

// ── Telemetry ───────────────────────────────────────────────────────────────

/**
 * Append a telemetry event to the NDJSON log.
 * Errors are silently swallowed — telemetry must never break anything.
 */
export function logEvent(event) {
  const line = JSON.stringify({ ts: new Date().toISOString(), ...event }) + '\n';
  try { appendFileSync(TELEMETRY_FILE, line, 'utf8'); }
  catch { /* intentionally silent */ }
  console.log(`[telemetry] ${line.trim()}`);
}

/**
 * Read all telemetry events. Returns array sorted by timestamp ascending.
 */
export function getEvents() {
  try {
    return readFileSync(TELEMETRY_FILE, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map(line => JSON.parse(line));
  } catch { return []; }
}

/**
 * Clear all telemetry events.
 */
export function clearTelemetry() {
  try { writeFileSync(TELEMETRY_FILE, '', 'utf8'); return { ok: true }; }
  catch (e) { return { error: e.message }; }
}
