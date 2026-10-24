Every number on a resource page comes from one of three places: the upstream repository at a pinned commit, a recorded capture of that commit's file tree, or a check run while building this site. This page explains all three, plus what the review did not cover.

## Capture

Each of the fourteen repositories was cloned at a specific commit. The tracked file list was recorded with sizes and, where the capture recorded them, SHA-256 per file. The captures happened on 24 October 2026 in Asia/Singapore. Upstream branches move; the commit is what this library describes.

The recorded trees are published as `data/trees/<resource>.json`. Entries carry a path and a byte count. A listed path means the file exists at that commit. It does not mean the file was read, and it is not a copy of the file.

REA is the exception that proves the rule: its tree contains 5,848 files and five submodule entries. The submodules are recorded by gitlink commit, and their contents were never downloaded, so they are not reviewed at all.

## Verification run for this release

The following was checked against GitHub's API at build time, not copied from earlier notes:

| Check | Result |
| --- | --- |
| Pinned commit exists | 14 of 14 |
| Operative entry path resolves at that commit | 14 of 14 |
| Recorded file count matches the commit's tree | 13 of 13 file-only trees; REA matches as 5,848 files plus 5 submodules |
| Licence identifier | 13 of 14 match the repository licence metadata; Lucide's file is ISC while GitHub reports NOASSERTION |
| Recursive tree truncated | 0 of 14 |
| Kumo path set against the live tree | identical, 768 paths |

The per-page provenance block repeats the commit, the licence, the file count and the date for that resource, so a reader does not have to trust this table alone.

## What was read

For each resource, between two and four operative files were read in full or in substantial part: the skill entry point, a reference or theme, and an implementation entry such as a script, parser or component. Those paths are listed on each resource page and in `data/catalog.json` under `inspected_paths`.

Everything else is a recorded path, not a read one. Large repositories were sampled. This is an integration review, not a line-by-line audit and not a security review.

## What was not done

- No skill was installed into a host, and no host hooks were enabled.
- No test suite for the fourteen projects was run as part of this build, apart from the small checks recorded on individual pages.
- No paid API, browser session, MCP registration or reverse engineering target was used.
- No private material was read for the published pages.

Where a resource page says a check ran, it ran during the original review and the result is reported as observed, including the failures.

## Corrections carried into this release

- Lucide is ISC, confirmed by reading `LICENSE` at the pinned commit. GitHub's detector reports NOASSERTION, so the label is sourced from the file.
- REA's file count is 5,853 tree entries, of which five are submodules. The earlier count treated all entries as files.
- The Kumo tree was rebuilt from the recorded archive and compared with the live GitHub tree at the same commit: the path sets are identical.
- Licences were checked per repository rather than assumed. Scrapling is BSD-3-Clause and Lucide is ISC; the other twelve are MIT.

## Upstream ownership

The resources belong to their authors. This library links to them at pinned commits and keeps their licence names visible. It does not redistribute their source. Where a page quotes behaviour, it describes what the code does at that commit, and the pinned link is there so you can check.
