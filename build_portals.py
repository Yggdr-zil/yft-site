#!/usr/bin/env python3
"""Generate per-fund investor portal pages from template.

Run from the yft-site repo root (after `npm run build` + `inject_auth_gate.py`):
  python3 build_portals.py
  python3 build_portals.py --dry-run   # preview only
"""

import sys
from pathlib import Path

DIST = Path(__file__).parent / "dist"
TEMPLATE = Path(__file__).parent / "investor-portal.html"

# Fund slug → (display name, deck path)
FUNDS = {
    "1517":      ("1517 Fund",           "/1517-deck/"),
    "iv":        ("Industry Ventures",   "/industry-ventures-deck/"),
    "contrary":  ("Contrary Capital",    "/contrary-deck/"),
    "lux":       ("Lux Capital",         "/lux-deck/"),
    "precursor": ("Precursor Ventures",  "/precursor-deck/"),
    "qed":       ("QED Investors",       "/qed-deck/"),
    "nyca":      ("NYCA Partners",       "/nyca-deck/"),
    "ribbit":    ("Ribbit Capital",      "/ribbit-deck/"),
}

DRY_RUN = "--dry-run" in sys.argv


def main():
    if not TEMPLATE.exists():
        print(f"ERROR: Template not found: {TEMPLATE}")
        sys.exit(1)
    if not DIST.exists():
        print(f"ERROR: dist/ not found — run 'npm run build' first")
        sys.exit(1)

    template = TEMPLATE.read_text(encoding="utf-8")
    print(f"Portal build — {'DRY RUN' if DRY_RUN else 'LIVE'}")
    print(f"Template: {TEMPLATE}")
    print(f"Funds: {len(FUNDS)}\n")

    for fund_id, (fund_name, deck_path) in sorted(FUNDS.items()):
        out_dir = DIST / "portal" / fund_id
        out_file = out_dir / "index.html"

        html = (template
                .replace("__FUND_ID__", fund_id)
                .replace("__FUND_NAME__", fund_name)
                .replace("__DECK_PATH__", deck_path))

        if DRY_RUN:
            print(f"  [dry]  portal/{fund_id}/index.html  ({fund_name})")
        else:
            out_dir.mkdir(parents=True, exist_ok=True)
            out_file.write_text(html, encoding="utf-8")
            print(f"  [done] portal/{fund_id}/index.html  ({fund_name})")

    # Copy docs/ from public/ into dist/ (PDFs for portal iframes)
    docs_src = Path(__file__).parent / "public" / "docs"
    docs_dst = DIST / "docs"
    if docs_src.exists():
        if not DRY_RUN:
            docs_dst.mkdir(parents=True, exist_ok=True)
        for pdf in sorted(docs_src.glob("*.pdf")):
            dst = docs_dst / pdf.name
            if DRY_RUN:
                print(f"  [dry]  docs/{pdf.name}")
            else:
                dst.write_bytes(pdf.read_bytes())
                print(f"  [done] docs/{pdf.name}")
    else:
        print(f"\n  [warn] No public/docs/ found — PDFs won't be available")

    print("\nDone.")


if __name__ == "__main__":
    main()
