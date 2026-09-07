#!/usr/bin/env python3
"""Minify JSON templates so they fit Shopify's 512 KB per-file upload limit.

Shopify stores JSON templates pretty-printed and hands them back that way, so
every theme-editor change or `shopify theme pull` re-inflates them. index.json
comes back around 616 KB — over the limit — and the next push is rejected.

Run this before pushing:

    python3 minify-theme-json.py
    shopify theme push --store jewellerythemeset --theme 162567979244

Whitespace is the only thing removed; the leading auto-generated comment block
is kept, and settings are untouched.
"""

import json
import pathlib
import re
import sys

LIMIT = 512 * 1024
COMMENT = re.compile(r"/\*.*?\*/", re.S)
ROOT = pathlib.Path(__file__).parent


def minify(path):
    raw = path.read_text()
    header = ""
    lead = re.match(r"\s*/\*.*?\*/\s*", raw, re.S)
    if lead:
        header = lead.group(0).rstrip() + "\n"

    try:
        data = json.loads(COMMENT.sub("", raw))
    except json.JSONDecodeError as exc:
        return None, f"invalid JSON ({exc})"

    out = header + json.dumps(data, separators=(",", ":"), ensure_ascii=False)
    if len(out) >= len(raw):
        return None, None
    path.write_text(out)
    return (len(raw), len(out)), None


def main():
    changed = oversize = 0
    for path in sorted(ROOT.glob("templates/**/*.json")) + sorted(ROOT.glob("sections/*.json")):
        sizes, error = minify(path)
        rel = path.relative_to(ROOT)
        if error:
            print(f"  skipped {rel}: {error}", file=sys.stderr)
            continue
        if sizes:
            before, after = sizes
            print(f"  {rel}: {before:,} -> {after:,} bytes")
            changed += 1
        if path.stat().st_size > LIMIT:
            print(f"  STILL OVER LIMIT: {rel} ({path.stat().st_size:,} bytes)", file=sys.stderr)
            oversize += 1

    print(f"\n{changed} file(s) minified.")
    if oversize:
        print(f"{oversize} file(s) still exceed 512 KB — content needs trimming, not whitespace.")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
