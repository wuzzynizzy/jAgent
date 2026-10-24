Spec Kit is a specification-driven development toolkit: a CLI, templates and agent integrations that turn a request into testable user stories, a plan, tasks and convergence checks.

## What it does

The spec template separates user scenarios, requirements, measurable outcomes and assumptions. Planning and task commands generate the artefacts an agent works from, and the implementation checks keep reviewer-owned requirement checklists separate from implementation progress. That separation exists so an agent cannot tick boxes to pass a gate it did not satisfy.

## How to use

The captured quick start is:

```sh
uv tool install specify-cli
specify init my-project --integration copilot
```

Use the integration for the coding host you actually run. Command examples in the snapshot include `/speckit-constitution`, `/speckit-specify`, `/speckit-plan`, `/speckit-tasks`, `/speckit-implement` and `/speckit-converge`; older releases used dotted names.

The practical order is principles, then what and why, then clarification, then the technical plan, then tasks, then implementation, then verification.

## When to use it

Multi-step features, apps with several user journeys, work that changes hands, and anything where acceptance criteria must stay traceable.

## Limits

A supported CLI runtime, an installer and a working agent integration. Read an existing project before initialising anything inside it. Review extension hooks instead of executing third-party automation blindly.

A finished plan is not a tested feature. Keep scope proportionate with [Ponytail](page:ponytail). No project was initialised and no full CLI run happened during this review.
