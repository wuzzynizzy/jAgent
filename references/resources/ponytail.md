Ponytail is a set of engineering rules for making the smallest complete change. It is a discipline for scope and reuse, not a licence to cut features.

## What it does

The rules ask for the existing codebase first, then platform features, then installed dependencies, and only then a new layer. Review, audit and deferred-shortcut workflows are included, and some hosts get lifecycle hooks. The rule file protects everything the user asked for, along with validation, error handling, security, accessibility and meaningful tests.

`shortcut: <limit>, <when to upgrade>` is the documented way to record a deliberate limitation instead of hiding it.

## How to use

Read `.agents/rules/ponytail.md` and apply it to the change in front of you. For a supported host, follow its section in `INSTALL.md`, and review any hook before enabling it. Commands include `/ponytail`, `/ponytail-review`, `/ponytail-audit` and `/ponytail-debt`, with host-specific namespacing.

For each change: read callers, tests, fixtures and exports; fix the cause in shared code; keep validation and failure handling; add one small test for logic that is not trivial.

## When to use it

Normal software changes and code review, next to the visual work rather than instead of it.

## Limits

The guidance works without hooks. Hook integrations need Node and explicit host setup. Existing components with established behaviour usually beat a rebuilt native control.

Do not trade readability, correctness or a finished design for a lower line count. No hooks or adapters were installed during this review.
