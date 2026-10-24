The site you are reading is a static snapshot with a version number. This page explains how versions, checksums and restore steps work here, and what they can and cannot prove.

## Versioning

The library version is `1.0.0`, released 24 October 2026. It appears in `data/manifest.json`, in each chunk's `source_id`, and in the footer of every page. A chunk cited as `jagent@1.0.0:resource/humanizer/02` refers to this release.

Changes that alter content, counts or file layout produce a new version. The manifest keeps the version, the release date and the counts so a later copy can be compared with this one.

## Checksums

`checksums.sha256` at the site root lists the SHA-256 of every deployed file except itself. Verify a download or a deployment with:

```sh
sha256sum -c checksums.sha256
```

On macOS:

```sh
shasum -a 256 -c checksums.sha256
```

A mismatch means the file differs from the copy this manifest describes. That is useful for spotting a truncated upload, a partial deploy or a file edited after publication.

It does not prove authenticity. Anyone who can replace a file can usually replace the checksum list too. To use hashes as a real control, keep a copy of `checksums.sha256` somewhere the site cannot write, compare against that copy, and treat a difference as a signal to investigate.

## Restoring a known version

1. Take the release archive for the version you want. It contains the site at its root, with `index.html` at the top level.
2. Verify the archive against the hash recorded beside it.
3. Upload the archive to Cloudflare Pages as a direct upload, or serve the folder from any static host.
4. Compare `checksums.sha256` from the restored copy with your retained copy.

For GitHub Pages, the workflow in `.github/workflows/pages.yml` publishes the `public/` directory. Re-running it on a tagged commit republishes that commit.

## Snapshots and rollback

Hosted platforms keep deployment history, and Cloudflare Pages lets you roll back to an earlier successful production deployment. That is convenient, not permanent storage: it is tied to the account, and it is not an independent archive.

Keep at least two copies you control: the repository history, and one offline archive of each release. Neither makes the site undeletable, and neither stops a future agent from ignoring it. A backup preserves the files; it does not create memory.

## What would break this

- Deleting the repository and every local copy.
- Changing the build so the published files no longer match the recorded hashes without bumping the version.
- Editing generated files by hand instead of editing `build/content` and rebuilding.
- Pointing an agent at a stale copy while the version in the footer says otherwise.

If the version in a footer and the version in `data/manifest.json` disagree, the manifest is the one to trust and the deployment is inconsistent.
