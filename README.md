# jAgent

A reviewed library of fourteen agent skills, workflows and interface resources, published as a static site.

Live at https://wuzzynizzy.github.io/jAgent/ and https://jagent.pages.dev/.

## What is in it

- Fourteen resource pages. Each one covers what the tool does, the commands that run it, when it fits, where it stops, and the commit it describes.
- Recorded source trees for every resource, with each tracked path at the pinned commit linked to GitHub.
- Twelve task routes that map a job to a lead resource and a short sequence of steps.
- A typed knowledge graph of resources, guides and routes, with every edge also listed as text.
- Lexical search over 124 passages, running in the browser against a static index.
- Agent files: `llms.txt`, `AGENTS.md`, a versioned manifest, per-page chunks with stable source IDs, and checksums for the whole deployment.
- Guides: design contract, context protocol, retrieval status, provenance, versions and recovery.

## What it is not

No server, no vector database and no model in the loop. Search is lexical and local. The site publishes public resource material only; private notes, project handoffs and credentials are not part of it and never will be.

The retrieval page states this plainly, including what a future vector integration would require.

## Build

```sh
python3 -m venv .venv
.venv/bin/pip install -r build/requirements.txt
.venv/bin/python build/build.py
.venv/bin/python build/check.py
```

`build/build.py` writes `public/` from `build/content` and `build/inputs`. Nothing else is read, so a clone can reproduce the site.

`build/check.py` verifies internal links and anchors, markdown twins, data cross references, chunk anchors, checksums, page metadata, the Cloudflare Pages limits, an explicit file allowlist and the privacy scan.

## Browser checks

```sh
npm install
npx playwright install chromium   # any current Chromium build works
node build/browser_check.mjs --shots /tmp/jagent-shots
```

The script serves `public/` on a local port and checks the things a static scan cannot: Google Sans actually loading, console and request errors, horizontal overflow at 320, 390, 768, 1024 and 1440 pixels, skip link and focus, category filters, search including the no-results and index-failure states, the recorded tree at 5,782 paths, graph selection and filtering, the copy control, reduced motion, and that the Markdown and JSON files are served as themselves.

## Package

```sh
.venv/bin/python build/package.py
```

That writes two archives into `releases/`:

- `jagent-pages-<version>.zip`: only the deployable site, with `index.html` at the archive root.
- `jagent-source-<version>.zip`: this repository without build output, dependencies or release archives.

A `SHA256SUMS.txt` file sits beside them.

## Deploy

See [DEPLOY.md](DEPLOY.md) for Cloudflare Pages and GitHub Pages steps. Every URL in the site is relative, so the same archive works at a domain root or under `/jAgent/`.

## Layout

```
build/content    authored pages, resources, tasks, graph
build/inputs     verified source metadata and recorded trees
build/assets     CSS, JS, fonts
build/           build, check, package and browser test scripts
public/          generated site (not edited by hand)
releases/        packaged archives
```

## Licence and provenance

Guides are CC BY 4.0, code is MIT. The fourteen resources belong to their authors and keep their own licences; this site links to them at pinned commits and does not redistribute their source.

The design follows a measured public reference for type, spacing, control sizes and motion, adapted for a reading and retrieval interface. The rules and the measurements are in `build/content/docs/design-contract.md`.
