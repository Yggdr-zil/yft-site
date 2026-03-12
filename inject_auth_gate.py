#!/usr/bin/env python3
"""Inject a JS/CSS auth gate into every *-deck/index.html in dist/.

Run from the yft-site repo root:
  python3 inject_auth_gate.py
  python3 inject_auth_gate.py --dry-run   # preview only
"""

import sys
import re
from pathlib import Path

DIST = Path(__file__).parent / "dist"

AUTH_GATE_STYLE = """
<style id="yft-gate-style">
#yft-gate {
  position: fixed; inset: 0; z-index: 99999;
  background: #0c1624;
  display: flex; align-items: center; justify-content: center;
  font-family: 'IBM Plex Sans', system-ui, sans-serif;
}
#yft-gate.dismissed { display: none; }
.yft-card {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(197,149,42,0.30);
  border-radius: 8px;
  padding: 40px 48px;
  width: 360px;
  text-align: center;
}
.yft-card h2  { color: #f0ece4; font-size: 1.1rem; font-weight: 500; margin: 0 0 6px; }
.yft-card > p { color: rgba(240,236,228,0.55); font-size: 0.82rem; margin: 0 0 24px; }
.yft-inp {
  width: 100%; box-sizing: border-box;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(197,149,42,0.20);
  border-radius: 4px;
  padding: 10px 14px;
  color: #f0ece4; font-size: 0.9rem;
  outline: none; margin-bottom: 12px;
}
.yft-inp::placeholder { color: rgba(240,236,228,0.35); }
.yft-inp:focus { border-color: rgba(197,149,42,0.55); }
.yft-btn {
  width: 100%;
  background: #C5952A; border: none; border-radius: 4px;
  color: #0c1624; font-size: 0.9rem; font-weight: 600;
  padding: 11px 0; cursor: pointer; margin-top: 4px;
  transition: background 0.15s;
}
.yft-btn:hover { background: #d4a53a; }
.yft-btn:disabled { background: rgba(197,149,42,0.3); cursor: default; }
.yft-err {
  color: #f87171; font-size: 0.8rem;
  margin-top: 10px; display: none;
}
.yft-logo {
  color: rgba(197,149,42,0.7); font-size: 0.7rem;
  letter-spacing: 0.12em; text-transform: uppercase;
  margin-bottom: 18px;
}
</style>
"""

AUTH_GATE_HTML = """
<!-- AUTH GATE -->
<div id="yft-gate">
  <div class="yft-card">
    <div class="yft-logo">Yggdrasil Financial Technologies</div>
    <h2>Confidential Materials</h2>
    <p>Enter your fund credentials to access this presentation.</p>
    <input id="yft-uid" class="yft-inp" type="text"     placeholder="Fund ID"   autocomplete="username"         />
    <input id="yft-pw"  class="yft-inp" type="password" placeholder="Password"  autocomplete="current-password" />
    <button id="yft-submit" class="yft-btn">Access Deck</button>
    <div id="yft-err" class="yft-err">Invalid credentials. Please try again.</div>
  </div>
</div>

<script>
(function () {
  // Deck-specific key so each fund's auth is isolated in sessionStorage
  var SESSION_KEY = 'yft_session_' + location.pathname.replace(/\//g, '_');
  var gate = document.getElementById('yft-gate');

  function dismiss() {
    gate.classList.add('dismissed');
    document.body.style.overflow = '';
  }

  function getToken() {
    try { var s = JSON.parse(sessionStorage.getItem(SESSION_KEY)); return s && s.token; } catch(e) { return null; }
  }

  function startSlideTracking() {
    var counter = document.querySelector('.slide-counter');
    if (!counter) return;
    var lastSlide = 1;
    var obs = new MutationObserver(function() {
      var text = counter.textContent || '';
      var m = text.match(/(\d+)\s*\/\s*(\d+)/);
      if (!m) return;
      var current = parseInt(m[1], 10);
      var total   = parseInt(m[2], 10);
      if (current === lastSlide) return;
      var direction = current > lastSlide ? 'forward' : 'back';
      lastSlide = current;
      var tok = getToken();
      if (!tok) return;
      fetch('/api/telemetry/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok },
        body: JSON.stringify({ event: 'slide_view', page: window.location.pathname,
                               detail: 'slide_' + current + '_of_' + total + '_' + direction }),
      }).catch(function() {});
    });
    obs.observe(counter, { childList: true, subtree: true, characterData: true });
  }

  // Already authenticated this session?
  try {
    var stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      var s = JSON.parse(stored);
      if (s && s.token) { dismiss(); startSlideTracking(); return; }
    }
  } catch (e) {}

  // Block scroll while gate is visible
  document.body.style.overflow = 'hidden';

  document.getElementById('yft-submit').addEventListener('click', function () {
    var btn = this;
    var uid = document.getElementById('yft-uid').value.trim();
    var pw  = document.getElementById('yft-pw').value;
    var err = document.getElementById('yft-err');
    err.style.display = 'none';
    if (!uid || !pw) return;

    btn.disabled = true;
    btn.textContent = 'Verifying\u2026';

    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: uid, password: pw }),
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (res.ok && res.d.token) {
          sessionStorage.setItem(SESSION_KEY, JSON.stringify({
            token: res.d.token, fundId: res.d.fundId, fundName: res.d.fundName
          }));
          // Fire deck_view telemetry — errors silently swallowed
          fetch('/api/telemetry/event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + res.d.token },
            body: JSON.stringify({ event: 'deck_view', page: window.location.pathname }),
          }).catch(function () {});
          // Small delay so dismiss doesn't fire into deck's keyup/click listeners
          setTimeout(function() { dismiss(); startSlideTracking(); }, 50);
        } else {
          err.style.display = 'block';
          btn.disabled = false;
          btn.textContent = 'Access Deck';
        }
      })
      .catch(function () {
        err.style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'Access Deck';
      });
  });

  document.getElementById('yft-pw').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.stopPropagation();
      e.preventDefault();
      document.getElementById('yft-submit').click();
    }
  });
})();
</script>
"""

MARKER = "<!-- AUTH GATE -->"
DRY_RUN = "--dry-run" in sys.argv


def inject(html_path: Path) -> bool:
    """Inject auth gate into html_path. Returns True if file was modified."""
    text = html_path.read_text(encoding="utf-8")

    # Skip if already injected
    if MARKER in text:
        print(f"  [skip]   {html_path.relative_to(DIST)} (already injected)")
        return False

    # Inject style into <head> (before </head>)
    if "</head>" not in text:
        print(f"  [warn]   {html_path.relative_to(DIST)} — no </head>, skipping")
        return False

    text = text.replace("</head>", AUTH_GATE_STYLE + "</head>", 1)

    # Inject gate div + script right after <body>
    if "<body>" in text:
        text = text.replace("<body>", "<body>" + AUTH_GATE_HTML, 1)
    elif re.search(r"<body\s[^>]*>", text):
        text = re.sub(r"(<body\s[^>]*>)", r"\1" + AUTH_GATE_HTML, text, count=1)
    else:
        print(f"  [warn]   {html_path.relative_to(DIST)} — no <body>, skipping")
        return False

    if not DRY_RUN:
        html_path.write_text(text, encoding="utf-8")
        print(f"  [done]   {html_path.relative_to(DIST)}")
    else:
        print(f"  [dry]    {html_path.relative_to(DIST)}")
    return True


deck_dirs = sorted(p for p in DIST.iterdir() if p.is_dir() and p.name.endswith("-deck"))

print(f"Auth gate injection — {'DRY RUN' if DRY_RUN else 'LIVE'}")
print(f"Found {len(deck_dirs)} deck folders\n")

for d in deck_dirs:
    idx = d / "index.html"
    if idx.exists():
        inject(idx)
    else:
        print(f"  [miss]   {d.name}/index.html not found")

print("\nDone.")
