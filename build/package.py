#!/usr/bin/env python3
"""Package the site for upload and the repository for archiving.

    python3 build/package.py

Writes releases/jagent-pages-<version>.zip  (deployment only, index.html at the root)
       releases/jagent-source-<version>.zip (source and build, no generated output)
       releases/SHA256SUMS.txt
"""
from __future__ import annotations

import hashlib
import json
import shutil
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
RELEASES = ROOT / "releases"
SITE = json.loads((ROOT / "build/content/site.json").read_text())
VERSION = SITE["version"]

SOURCE_INCLUDE = ["build", "README.md", "DEPLOY.md", "LICENSE", "CONTENT-LICENSE.md",
                  ".gitignore", ".github"]
SOURCE_EXCLUDE_DIRS = {"__pycache__", "node_modules", ".venv", ".git", "releases", "kit",
                       "google_drive", ".arena"}


def add_tree(zf: zipfile.ZipFile, base: Path) -> int:
    count = 0
    for path in sorted(base.rglob("*")):
        if not path.is_file():
            continue
        rel = path.relative_to(base).as_posix()
        zf.write(path, rel)
        count += 1
    return count


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 512), b""):
            digest.update(block)
    return digest.hexdigest()


def main() -> int:
    if not (PUBLIC / "index.html").exists():
        print("public/index.html is missing. Run build/build.py first.")
        return 1
    RELEASES.mkdir(exist_ok=True)
    for old in RELEASES.glob("*.zip"):
        old.unlink()

    pages_zip = RELEASES / f"jagent-pages-{VERSION}.zip"
    with zipfile.ZipFile(pages_zip, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
        count = add_tree(zf, PUBLIC)
    if not any(name == "index.html" for name in zipfile.ZipFile(pages_zip).namelist()):
        print("index.html is not at the archive root; refusing to ship this archive")
        return 1

    source_zip = RELEASES / f"jagent-source-{VERSION}.zip"
    with zipfile.ZipFile(source_zip, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
        for item in SOURCE_INCLUDE:
            path = ROOT / item
            if path.is_dir():
                for sub in sorted(path.rglob("*")):
                    if not sub.is_file():
                        continue
                    if any(part in SOURCE_EXCLUDE_DIRS for part in sub.relative_to(ROOT).parts):
                        continue
                    zf.write(sub, f"jagent-{VERSION}/" + sub.relative_to(ROOT).as_posix())
            elif path.is_file():
                zf.write(path, f"jagent-{VERSION}/{item}")

    lines = []
    for archive in (pages_zip, source_zip):
        lines.append(f"{sha256(archive)}  {archive.name}")
    (RELEASES / "SHA256SUMS.txt").write_text("\n".join(lines) + "\n")

    print(f"pages archive:  {pages_zip.name}  {count} files, {pages_zip.stat().st_size / 1024:.0f} KB")
    print(f"source archive: {source_zip.name}  {source_zip.stat().st_size / 1024:.0f} KB")
    print(f"checksums:      SHA256SUMS.txt")
    return 0


if __name__ == "__main__":
    sys.exit(main())
