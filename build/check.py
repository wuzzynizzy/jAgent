#!/usr/bin/env python3
"""Validate the built site before it is packaged.

Checks internal links and anchors, data cross-references, the privacy allowlist,
the design bans, checksums, page metadata and Cloudflare Pages limits.

    python3 build/check.py

Exit code 0 means every check passed. Failures are listed with the file and the
reason so they can be fixed rather than ignored.
"""
from __future__ import annotations

import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
VERSION = json.loads((ROOT / "build/content/site.json").read_text())["version"]

ALLOWED_SUFFIXES = {".html", ".md", ".txt", ".json", ".jsonl", ".css", ".js", ".woff2",
                    ".xml", ".sha256", ".svg", ".ico", ".png"}
PRIVATE_MARKERS = [
    "drive.google", "docs.google", "1Ppd4WcUj78ukmBBIPrw-pEbYbd4EEnxg", "restart kit",
    "handover", "google_drive", "source-manifest.json", "Review-evidence", "Reference-source-text",
    "skills-site", "Kumo-source-947065ad", "Freebuff-measurements", "playwright/.auth",
]
LIMITS = {"files": 20000, "file_bytes": 25 * 1024 * 1024, "total_bytes": 100 * 1024 * 1024}

failures: list[str] = []
notes: list[str] = []


def fail(message: str) -> None:
    failures.append(message)


class PageScanner(HTMLParser):
    def __init__(self, path: Path):
        super().__init__(convert_charrefs=True)
        self.path = path
        self.links: list[tuple[str, str]] = []
        self.ids: set[str] = set()
        self.h1 = 0
        self.title = ""
        self.description = ""
        self._in_title = False
        self._in_h1 = False
        self.scripts: list[str] = []
        self.inline_handlers: list[str] = []
        self.data_attrs: list[tuple[str, str]] = []
        self.has_canonical = False
        self.has_md_alternate = False
        self.text: list[str] = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if "id" in attrs:
            if attrs["id"] in self.ids:
                fail(f"{self.path}: duplicate id {attrs['id']!r}")
            self.ids.add(attrs["id"])
        if tag == "a" and "href" in attrs:
            self.links.append(("href", attrs["href"]))
        if tag == "link" and "href" in attrs:
            self.links.append(("link", attrs["href"]))
            rel = (attrs.get("rel") or "").lower()
            if rel == "canonical":
                self.has_canonical = True
            if rel == "alternate" and attrs.get("type") == "text/markdown":
                self.has_md_alternate = True
        if tag in {"img", "script", "source"} and "src" in attrs:
            self.links.append((tag, attrs["src"]))
            if tag == "script" and attrs["src"].startswith("http"):
                fail(f"{self.path}: external script {attrs['src']}")
        for name, value in attrs.items():
            if name.startswith("on"):
                self.inline_handlers.append(name)
            if name.startswith("data-") and value and ("/" in value or value.endswith(".json")):
                if name in {"data-tree", "data-href"}:
                    self.data_attrs.append((name, value))
        if tag == "title":
            self._in_title = True
        if tag == "h1":
            self.h1 += 1
            self._in_h1 = True
        if tag == "meta" and attrs.get("name") == "description":
            self.description = attrs.get("content", "")

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False
        if tag == "h1":
            self._in_h1 = False

    def handle_data(self, data):
        if self._in_title:
            self.title += data
        if self._in_h1:
            self.text.append(data)


def resolve(base_file: Path, href: str) -> tuple[Path | None, str]:
    """Map a link to a file inside public, plus any fragment."""
    parts = urlsplit(href)
    if parts.scheme or parts.netloc:
        return None, ""
    path = unquote(parts.path)
    if not path:
        return base_file, parts.fragment
    target = (base_file.parent / path).resolve()
    try:
        target.relative_to(PUBLIC.resolve())
    except ValueError:
        return Path("/nonexistent"), parts.fragment
    if path.endswith("/") or target.is_dir():
        target = target / "index.html"
    return target, parts.fragment


def main() -> int:
    if not PUBLIC.exists():
        print("public/ does not exist; run build/build.py first")
        return 2

    files = sorted(p for p in PUBLIC.rglob("*") if p.is_file())
    by_rel = {p.relative_to(PUBLIC).as_posix(): p for p in files}

    # --- required files
    for required in ["index.html", "404.html", "llms.txt", "AGENTS.md", "robots.txt", "sitemap.xml",
                     "checksums.sha256", "data/manifest.json", "data/catalog.json", "data/graph.json",
                     "data/search-index.json", "data/chunks/all.jsonl", "data/chunks/manifest.json",
                     "assets/site.css", "assets/app.js", "assets/fonts/google-sans-latin.woff2",
                     "assets/fonts/OFL.txt", "assets/fonts/FONT-SOURCE.txt"]:
        if required not in by_rel:
            fail(f"missing required file: {required}")

    # --- allowlist of file types
    for path in files:
        if path.suffix.lower() not in ALLOWED_SUFFIXES:
            fail(f"unexpected file type in deployment: {path.relative_to(PUBLIC)}")
        if path.name.startswith(".") or path.name in {"Thumbs.db", "desktop.ini"}:
            fail(f"system file in deployment: {path.relative_to(PUBLIC)}")
        if path.stat().st_size > LIMITS["file_bytes"]:
            fail(f"file exceeds the 25 MiB asset limit: {path.relative_to(PUBLIC)}")
    if len(files) > LIMITS["files"]:
        fail(f"{len(files)} files exceeds the {LIMITS['files']} file limit")
    total = sum(p.stat().st_size for p in files)
    if total > LIMITS["total_bytes"]:
        fail(f"{total} bytes exceeds the 100 MB target")

    # --- html pages
    pages: dict[Path, PageScanner] = {}
    for path in files:
        if path.suffix != ".html":
            continue
        scanner = PageScanner(path)
        raw = path.read_text(encoding="utf-8")
        scanner.feed(raw)
        pages[path] = scanner
        rel = path.relative_to(PUBLIC)
        if scanner.h1 != 1:
            fail(f"{rel}: expected exactly one h1, found {scanner.h1}")
        if not scanner.title.strip():
            fail(f"{rel}: missing title")
        if len(scanner.description.strip()) < 30:
            fail(f"{rel}: meta description missing or too short")
        if not scanner.has_canonical:
            fail(f"{rel}: missing canonical link")
        if not scanner.has_md_alternate:
            fail(f"{rel}: missing markdown alternate")
        if re.search(r'(?:href|src)="(?:page|file|chunk):', raw):
            fail(f"{rel}: unresolved internal link scheme left in the HTML")
        if scanner.inline_handlers:
            fail(f"{rel}: inline event handlers {scanner.inline_handlers}")
        for kind, value in scanner.links + [("data", v) for _, v in scanner.data_attrs]:
            if value.startswith(("http://", "https://", "mailto:", "tel:")):
                if value.startswith("http://"):
                    fail(f"{rel}: insecure absolute link {value}")
                continue
            target, fragment = resolve(path, value)
            if target is None:
                continue
            if not target.exists():
                fail(f"{rel}: broken link {value!r}")
                continue
            if fragment and target.suffix == ".html":
                frag_scanner = pages.get(target)
                if frag_scanner is None:
                    frag_scanner = PageScanner(target)
                    frag_scanner.feed(target.read_text(encoding="utf-8"))
                if fragment not in frag_scanner.ids:
                    fail(f"{rel}: link {value!r} points at missing anchor #{fragment}")

    # --- banned design patterns
    for path in files:
        if path.suffix not in {".html", ".css", ".js"}:
            continue
        text = path.read_text(encoding="utf-8")
        for match in re.finditer(r"(?:::{0,1}(?:before|after)|::(?:before|after))[^{}]*\{[^{}]*content\s*:", text):
            line = text.count("\n", 0, match.start()) + 1
            fail(f"{path.relative_to(PUBLIC)}:{line}: generated pseudo-element content")
        for match in re.finditer(r"border-left\s*:", text):
            line = text.count("\n", 0, match.start()) + 1
            fail(f"{path.relative_to(PUBLIC)}:{line}: left accent border")
        for match in re.finditer(r"●|🔴|🟢", text):
            line = text.count("\n", 0, match.start()) + 1
            fail(f"{path.relative_to(PUBLIC)}:{line}: decorative status dot")
        if "\u2014" in text:
            line = text.count("\n", 0, text.index("\u2014")) + 1
            fail(f"{path.relative_to(PUBLIC)}:{line}: em dash in published text")

    # --- privacy scan
    for path in files:
        if path.suffix not in {".html", ".md", ".json", ".jsonl", ".txt", ".css", ".js", ".xml"}:
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        low = text.lower()
        for marker in PRIVATE_MARKERS:
            if marker.lower() in low:
                fail(f"privacy: {path.relative_to(PUBLIC)} contains {marker!r}")
        if re.search(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", text):
            for match in re.finditer(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", text):
                value = match.group(0)
                if value.endswith(("github.com", "example.com")):
                    continue
                fail(f"privacy: {path.relative_to(PUBLIC)} contains an email address {value!r}")

    # --- markdown twins
    for path in files:
        if path.suffix != ".md":
            continue
        rel = path.relative_to(PUBLIC)
        text = path.read_text(encoding="utf-8")
        if "\u2014" in text:
            fail(f"{rel}: em dash in markdown")
        if re.search(r"\]\((?:page|file|chunk):", text):
            fail(f"{rel}: unresolved internal link scheme left in the markdown")
        for match in re.finditer(r"\]\(([^)\s]+)\)", text):
            value = match.group(1)
            if value.startswith(("http://", "https://", "mailto:")):
                continue
            target, fragment = resolve(path, value)
            if target is None or not target.exists():
                fail(f"{rel}: broken markdown link {value!r}")

    # --- data files
    manifest = json.loads((PUBLIC / "data/manifest.json").read_text())
    catalog = json.loads((PUBLIC / "data/catalog.json").read_text())
    graph = json.loads((PUBLIC / "data/graph.json").read_text())
    chunks_manifest = json.loads((PUBLIC / "data/chunks/manifest.json").read_text())
    search_index = json.loads((PUBLIC / "data/search-index.json").read_text())
    version_file = json.loads((PUBLIC / f"data/versions/{VERSION}.json").read_text())

    if manifest["version"] != VERSION:
        fail("manifest version does not match the site version")
    if len(catalog) != 14:
        fail(f"catalog has {len(catalog)} resources, expected 14")
    node_ids = {node["id"] for node in graph["nodes"]}
    for node in graph["nodes"]:
        page = node["page"]
        target = PUBLIC / "resources" / page / "index.html" if node["type"] == "resource" else (
            PUBLIC / "docs" / page / "index.html" if node["type"] == "doc" else PUBLIC / "tasks" / "index.html")
        if not target.exists():
            fail(f"graph node {node['id']} points at a missing page")
    for edge in graph["edges"]:
        if edge["from"] not in node_ids or edge["to"] not in node_ids:
            fail(f"graph edge with a missing node: {edge}")

    chunk_count = 0
    for entry in chunks_manifest["files"]:
        path = PUBLIC / entry["file"].lstrip("/")
        if not path.exists():
            fail(f"chunk file listed but missing: {entry['file']}")
            continue
        data = json.loads(path.read_text())
        chunk_count += data["count"]
        for chunk in data["chunks"]:
            page_url = chunk["url_html"].split("#")[0]
            target = PUBLIC / page_url.lstrip("/") / "index.html"
            if not target.exists():
                fail(f"chunk {chunk['id']} points at missing page {page_url}")
                continue
            if "#" in chunk["url_html"]:
                scanner = pages.get(target)
                if scanner and chunk["heading"] not in scanner.ids:
                    fail(f"chunk {chunk['id']} anchor #{chunk['heading']} missing from {page_url}")
    if chunk_count != manifest["counts"]["chunks"]:
        fail(f"chunk manifest says {chunk_count} chunks, site says {manifest['counts']['chunks']}")
    if len(search_index["chunks"]) != chunk_count:
        fail("search index passage count differs from the chunk count")
    for entry in search_index["chunks"]:
        page_url = entry["url_html"].split("#")[0]
        target = PUBLIC / page_url.lstrip("/") / "index.html"
        if not target.exists():
            fail(f"search passage {entry['id']} points at a missing page")

    # --- checksums
    checksum_path = PUBLIC / "checksums.sha256"
    listed = {}
    for line in checksum_path.read_text().splitlines():
        if not line.strip():
            continue
        digest, rel = line.split("  ", 1)
        listed[rel] = digest
    import hashlib
    for rel, digest in listed.items():
        path = PUBLIC / rel
        if not path.exists():
            fail(f"checksums list a missing file: {rel}")
            continue
        actual = hashlib.sha256(path.read_bytes()).hexdigest()
        if actual != digest:
            fail(f"checksum mismatch: {rel}")
    for path in files:
        rel = path.relative_to(PUBLIC).as_posix()
        if rel == "checksums.sha256":
            continue
        if rel not in listed:
            fail(f"file missing from checksums.sha256: {rel}")
    if len(version_file["files"]) + 2 != len(files):
        fail(f"version manifest lists {len(version_file['files'])} files, deployment has {len(files)} "
             f"(expected the manifest plus checksums.sha256 to be excluded)")

    # --- llms.txt
    llms = (PUBLIC / "llms.txt").read_text()
    base = manifest["canonical"]
    for match in re.finditer(r"\((https://[^)]+)\)", llms):
        url = match.group(1)
        if not url.startswith(base):
            notes.append(f"llms.txt link outside the canonical origin: {url}")
            continue
        rel = url[len(base):]
        rel = rel.split("#", 1)[0]
        target = PUBLIC / rel
        if rel == "" or rel.endswith("/"):
            target = target / "index.html"
        if not target.exists():
            fail(f"llms.txt link does not resolve locally: {url}")

    # --- sitemap
    sitemap = (PUBLIC / "sitemap.xml").read_text()
    locs = re.findall(r"<loc>([^<]+)</loc>", sitemap)
    if len(locs) != len(pages) - 1:
        notes.append(f"sitemap lists {len(locs)} URLs, html pages {len(pages)} (404 excluded)")

    # --- summary
    print(f"checked {len(files)} files, {len(pages)} HTML pages, {chunk_count} chunks, "
          f"{len(graph['edges'])} graph edges")
    for note in notes:
        print(f"note: {note}")
    if failures:
        print(f"\n{len(failures)} failure(s):")
        for item in failures[:80]:
            print(f"  - {item}")
        if len(failures) > 80:
            print(f"  ... and {len(failures) - 80} more")
        return 1
    print("all checks passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
