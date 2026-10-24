# Deploying jAgent

Two hosts, one archive. Every path in the site is relative, so the same files work at a domain root and under `/jAgent/`.

## Cloudflare Pages, direct upload

1. Unzip `jagent-pages-<version>.zip`. The archive root contains `index.html`, `404.html`, `llms.txt`, `assets/`, `data/`, `docs/`, `resources/`, `tasks/`, `graph/`, `search/`.
2. In the Cloudflare dashboard, open Workers and Pages, then Create, then Pages, then Upload assets.
3. Name the project `jagent`. That matches the `jagent.pages.dev` host used in the sitemap and in `llms.txt`.
4. Drag the unzipped folder, or select all of its contents, and upload. Do not upload the ZIP itself and do not upload a parent folder, or `index.html` ends up one level too deep.
5. Publish. The first deployment becomes production.
6. Optional but useful: add a custom 404 page. Cloudflare Pages serves `404.html` from the archive root automatically.

Limits at the time of writing: 20,000 files per deployment and 25 MiB per asset on the free plan. This build is 90 files and 2.9 MB, so there is room to grow, but check the current limits before adding large assets.

### Changing the canonical URL

`build/content/site.json` holds `canonical` and `mirrors`. Change them, rebuild, and the sitemap, `llms.txt` and page metadata follow. Nothing else hardcodes a host.

## GitHub Pages

The workflow in `.github/workflows/pages.yml` builds the site and publishes `public/` on every push to `main`, and can be run manually from the Actions tab.

1. In the repository settings, open Pages and set the source to GitHub Actions.
2. Push to `main`. The workflow installs Python, builds, runs the checks, uploads `public/` as the Pages artifact and deploys it.
3. The site appears at `https://wuzzynizzy.github.io/jAgent/`.

If the checks fail, the deployment stops. That is deliberate: a broken link or a privacy hit should block publication rather than ship.

## Verifying a deployment

Every release ships `checksums.sha256`, listing the SHA-256 of every deployed file except itself.

```sh
sha256sum -c checksums.sha256     # Linux
shasum -a 256 -c checksums.sha256 # macOS
```

A mismatch means the deployed file differs from the release. It does not prove the source is trustworthy, because whoever can replace a file can usually replace the checksum list too. Keep a copy of the checksum file somewhere the site cannot write and compare against that.

## Rolling back

Cloudflare Pages keeps earlier production deployments and lets you roll back to a successful one. GitHub Pages keeps the deployment history for the repository. Neither is an independent backup.

Keep two copies you control: the repository history, and an offline copy of each release archive.

## What not to upload

The private restart kit, exported working notes, browser state and anything else outside this repository. The deployment archive contains the site only; `build/package.py` builds it from `public/` and refuses to include anything else.
