"""Extract the Lucide icons this site uses into assets/icons.json.

Lucide is ISC licensed. The npm package is a build-time input only; the site
ships the extracted paths plus the licence text, not the package.

    npm pack lucide-static && tar -xzf lucide-static-*.tgz
    python3 tools/make_icons.py package/icons
"""
import json
import re
import sys
from pathlib import Path

NAMES = ["arrow-right", "external-link", "search", "copy", "check", "file-text",
         "chevron-right", "chevron-left", "sun", "moon", "monitor", "menu", "x",
         "filter", "list", "tree-pine", "link", "book-open", "circle-help"]

def main(src: Path) -> int:
    out = {}
    for name in NAMES:
        path = src / f"{name}.svg"
        if not path.exists():
            print(f"missing {name}")
            continue
        raw = path.read_text()
        inner = re.sub(r"^.*?<svg[^>]*>", "", raw, flags=re.S)
        inner = re.sub(r"</svg>\s*$", "", inner, flags=re.S).strip()
        inner = re.sub(r"\s+", " ", inner)
        out[name] = inner
    target = Path(__file__).resolve().parent.parent / "assets" / "icons.json"
    target.write_text(json.dumps(out, indent=1, sort_keys=True) + "\n")
    licence = src.parent / "LICENSE"
    if licence.exists():
        (target.parent / "ICONS-LICENSE.txt").write_text(
            "Lucide icon paths, ISC licence, extracted from lucide-static.\n\n" + licence.read_text())
    print(f"wrote {len(out)} icons to {target}")
    return 0

if __name__ == "__main__":
    sys.exit(main(Path(sys.argv[1] if len(sys.argv) > 1 else "package/icons")))
