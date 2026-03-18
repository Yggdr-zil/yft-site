import { readFileSync, existsSync } from "node:fs";
import { createServer } from "node:http";
import { createTransport } from "nodemailer";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { login, validateToken, validateAdmin, logEvent, getEvents, revokeByFund, addFund, getFunds } from "./auth.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load .env ──────────────────────────────────────────────────────────
try {
  const env = readFileSync(join(__dirname, ".env"), "utf8");
  for (const line of env.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim(), v = t.slice(eq + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
} catch { /* no .env — use env vars */ }

const PORT      = parseInt(process.env.PORT || "3001", 10);
const SMTP_HOST = process.env.SMTP_HOST || "127.0.0.1";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "1025", 10);
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const SMTP_SECURE = process.env.SMTP_SECURE === "true";
const MAIL_TO   = process.env.MAIL_TO   || "inquiries@yggfin.tech";
const MAIL_FROM = process.env.MAIL_FROM || SMTP_USER || "inquiries@yggfin.tech";
const TEMPLATE_DIR = join(process.env.DATA_DIR || __dirname, "templates");

// ── Rate limiting ──────────────────────────────────────────────────────
const rateMap = new Map();
function isRateLimited(ip) {
  const now = Date.now();
  const e = rateMap.get(ip);
  if (!e || now - e.t > 60_000) { rateMap.set(ip, { t: now, n: 1 }); return false; }
  return ++e.n > 10;
}
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of rateMap) if (now - v.t > 60_000) rateMap.delete(k);
}, 300_000);

// ── Mailer ─────────────────────────────────────────────────────────────
const transporter = createTransport({
  host: SMTP_HOST, port: SMTP_PORT, secure: SMTP_SECURE,
  auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  tls: { rejectUnauthorized: SMTP_HOST !== "127.0.0.1" && SMTP_HOST !== "localhost" },
});

// ── Helpers ────────────────────────────────────────────────────────────
const sanitize = (s, n = 2000) =>
  typeof s === "string" ? s.slice(0, n).replace(/[<>]/g, "") : "";

function json(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0;
    req.on("data", c => {
      size += c.length;
      if (size > 50_000) { reject(new Error("too large")); req.destroy(); return; }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString()));
    req.on("error", reject);
  });
}

function getClientIp(req) {
  return (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();
}

function getBearerToken(req) {
  const auth = req.headers["authorization"] || "";
  if (auth.startsWith("Bearer ")) return auth.slice(7).trim();
  return null;
}

// ── Server ─────────────────────────────────────────────────────────────
createServer(async (req, res) => {
  const ip = getClientIp(req);

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }

  // ── Health ────────────────────────────────────────────────────────
  if (req.method === "GET" && req.url === "/health") {
    return json(res, 200, { ok: true });
  }

  // ── Auth: Login ────────────────────────────────────────────────────
  if (req.method === "POST" && req.url === "/api/auth/login") {
    if (isRateLimited(ip)) return json(res, 429, { error: "Too many requests." });
    let body;
    try { body = JSON.parse(await readBody(req)); }
    catch { return json(res, 400, { error: "Invalid JSON" }); }

    const { username, password } = body;
    if (!username || !password) return json(res, 400, { error: "username and password required" });

    const result = login(String(username).toLowerCase(), String(password), ip);
    if (!result) return json(res, 401, { error: "Invalid credentials" });
    return json(res, 200, result);
  }

  // ── Telemetry: Log event ───────────────────────────────────────────
  if (req.method === "POST" && req.url === "/api/telemetry/event") {
    const token = getBearerToken(req);
    const sess = validateToken(token);
    if (!sess) return json(res, 401, { error: "Unauthorized" });

    let body;
    try { body = JSON.parse(await readBody(req)); }
    catch { return json(res, 400, { error: "Invalid JSON" }); }

    const { event, page, metadata } = body;
    if (!event) return json(res, 400, { error: "event field required" });

    logEvent({
      fund:     sess.fundId,
      event:    String(event).slice(0, 64),
      page:     page ? String(page).slice(0, 256) : undefined,
      ip,
      metadata: metadata || undefined,
    });
    return json(res, 200, { ok: true });
  }

  // ── Admin: View telemetry log ─────────────────────────────────────
  if (req.method === "GET" && req.url === "/api/admin/log") {
    let body;
    try { body = JSON.parse(await readBody(req)); } catch { body = {}; }

    // Admin auth via Basic or JSON body
    let adminUser, adminPass;
    const authHeader = req.headers["authorization"] || "";
    if (authHeader.startsWith("Basic ")) {
      const decoded = Buffer.from(authHeader.slice(6), "base64").toString();
      [adminUser, adminPass] = decoded.split(":", 2);
    } else {
      adminUser = body.username;
      adminPass = body.password;
    }

    if (!validateAdmin(adminUser, adminPass)) return json(res, 401, { error: "Unauthorized" });
    return json(res, 200, { events: getEvents() });
  }

  // ── Admin: Revoke fund ────────────────────────────────────────────
  if (req.method === "POST" && req.url === "/api/admin/revoke") {
    let body;
    try { body = JSON.parse(await readBody(req)); } catch { return json(res, 400, { error: "Invalid JSON" }); }

    const { username, password, fundId } = body;
    if (!validateAdmin(username, password)) return json(res, 401, { error: "Unauthorized" });
    if (!fundId) return json(res, 400, { error: "fundId required" });

    const count = revokeByFund(fundId);
    return json(res, 200, { ok: true, sessionsRevoked: count });
  }

  // ── Contact form ──────────────────────────────────────────────────
  if (req.method === "POST" && req.url === "/api/contact") {
    if (isRateLimited(ip)) return json(res, 429, { error: "Too many requests. Please try again." });

    let body;
    try { body = JSON.parse(await readBody(req)); }
    catch { return json(res, 400, { error: "Invalid request" }); }

    const { name, email, fund, message } = body;
    if (!name || !email || !message) return json(res, 400, { error: "name, email and message required" });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(res, 400, { error: "Invalid email" });

    const text = [
      `Name:    ${sanitize(name, 100)}`,
      `Email:   ${sanitize(email, 200)}`,
      fund ? `Fund:    ${sanitize(fund, 100)}` : null,
      "", "--- Message ---", "", sanitize(message),
    ].filter(Boolean).join("\n");

    try {
      await transporter.sendMail({
        from: `"YFT Investor Site" <${MAIL_FROM}>`,
        replyTo: `"${sanitize(name, 100)}" <${sanitize(email, 200)}>`,
        to: MAIL_TO,
        subject: `[YFT Inquiry] ${sanitize(fund || name, 80)}`,
        text,
      });
      console.log(`[${new Date().toISOString()}] Inquiry from ${email}`);
      return json(res, 200, { ok: true });
    } catch (err) {
      console.error(`[${new Date().toISOString()}] SMTP error:`, err.message);
      return json(res, 500, { error: "Failed to send. Please email inquiries@yggfin.tech directly." });
    }
  }

  // ── Dynamic portal serving ──────────────────────────────────────────
  const portalMatch = req.url.match(/^\/portal\/([a-z0-9-]+)\/?$/);
  if (req.method === "GET" && portalMatch) {
    const fundId = portalMatch[1];
    if (fundId === "admin") return json(res, 404, { error: "Not found" });

    const funds = JSON.parse(readFileSync(join(process.env.DATA_DIR || __dirname, "funds.json"), "utf8"));
    const fund = funds[fundId];
    if (!fund || !fund.active) return json(res, 404, { error: "Fund not found" });

    const templatePath = join(TEMPLATE_DIR, "portal-template.html");
    if (!existsSync(templatePath)) return json(res, 500, { error: "Portal template not found" });

    let html = readFileSync(templatePath, "utf8");
    html = html
      .replace(/__FUND_ID__/g, fundId)
      .replace(/__FUND_NAME__/g, fund.name)
      .replace(/__DECK_PATH__/g, `/${fundId}-deck/`);

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(html);
  }

  // ── Dynamic deck serving ──────────────────────────────────────────
  const deckMatch = req.url.match(/^\/([a-z0-9-]+)-deck\/?$/);
  if (req.method === "GET" && deckMatch) {
    const fundId = deckMatch[1];
    const fundsPath = join(process.env.DATA_DIR || __dirname, "funds.json");
    let funds;
    try { funds = JSON.parse(readFileSync(fundsPath, "utf8")); } catch { funds = {}; }
    const fund = funds[fundId];
    if (!fund || !fund.active) return json(res, 404, { error: "Fund not found" });

    const deckPath = join(TEMPLATE_DIR, "decks", `${fund.deckType}.html`);
    if (!existsSync(deckPath)) return json(res, 404, { error: "Deck template not found" });

    const html = readFileSync(deckPath, "utf8");
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(html);
  }

  // ── Admin: Add fund ──────────────────────────────────────────────
  if (req.method === "POST" && req.url === "/api/admin/add-fund") {
    let body;
    try { body = JSON.parse(await readBody(req)); }
    catch { return json(res, 400, { error: "Invalid JSON" }); }

    // Admin auth via Basic header or JSON body
    let adminUser, adminPass;
    const authHeader = req.headers["authorization"] || "";
    if (authHeader.startsWith("Basic ")) {
      const decoded = Buffer.from(authHeader.slice(6), "base64").toString();
      [adminUser, adminPass] = decoded.split(":", 2);
    } else {
      adminUser = body.username;
      adminPass = body.password;
    }
    if (!validateAdmin(adminUser, adminPass)) return json(res, 401, { error: "Unauthorized" });

    const { name, deckType } = body;
    const result = addFund(name, deckType);
    if (result.error) {
      const status = result.fundId ? 409 : 400;
      return json(res, status, { error: result.error });
    }

    logEvent({ fund: result.fundId, event: "admin_add_fund", metadata: { name: result.name, deckType: result.deckType } });
    return json(res, 200, result);
  }

  // ── Admin: List funds ───────────────────────────────────────────
  if (req.method === "GET" && req.url === "/api/admin/funds") {
    let body;
    try { body = JSON.parse(await readBody(req)); } catch { body = {}; }

    let adminUser, adminPass;
    const authHeader = req.headers["authorization"] || "";
    if (authHeader.startsWith("Basic ")) {
      const decoded = Buffer.from(authHeader.slice(6), "base64").toString();
      [adminUser, adminPass] = decoded.split(":", 2);
    } else {
      adminUser = body.username;
      adminPass = body.password;
    }
    if (!validateAdmin(adminUser, adminPass)) return json(res, 401, { error: "Unauthorized" });

    return json(res, 200, { funds: getFunds() });
  }

  json(res, 404, { error: "Not found" });

}).listen(PORT, () => {
  console.log(`YFT server on :${PORT} — auth + telemetry + contact`);
  console.log(`  ADMIN_USER: ${process.env.ADMIN_USER || "admin"}`);
  console.log(`  DATA_DIR:   ${process.env.DATA_DIR || "(default: server dir)"}`);
});
