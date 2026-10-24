REA, short for Reverse Engineer Anything, is a CLI and MCP system for evidence-based investigation of shipped applications, native binaries, JavaScript and Electron packages, managed artefacts and selected runtime behaviour.

## What it does

The project routes each target type to a provider and a workflow, then returns normalised findings with their limitations attached. The skill is explicit that REA is the wrong tool for ordinary architecture questions when complete source is available.

Evidence in, evidence out: static equality between two artefacts does not prove identical runtime behaviour, and the returned uncertainty is part of the result rather than noise to strip.

## How to use

Onboarding starts at `npx rea-agents setup`, but inspect the prerequisites and the setup plan for your client first. Registration and optional engine installation need approval.

For an authorised JavaScript or Electron tree, the documented CLI route is:

```sh
npx -y rea-agents@latest analyze-javascript-application /absolute/path/to/app --json
```

Prefer a version-pinned installation for repeatable work. Read the evidence and the stated uncertainty. Route native, managed, Android and browser targets through the matching skill reference and installed provider.

## When to use it

A question that requires a shipped artefact, a decompiled or disassembled view, a version comparison, or a requested observation of runtime behaviour. Use it on targets you are authorised to inspect.

## Limits

The captured package is v6.7.0 and declares Node `^22.23.4 || ^24.22.1 || >=26.12.1`; check that against the release you install. Native engines such as Ghidra, Hopper or IDA are separate installations with their own licences.

The repository's MIT licence does not relicense third-party engines or the applications you point them at. Installing the skill does not register MCP tools in a running chat.

The five submodule directories under `third_party/` were recorded as gitlink commits, not downloaded, so their contents were not reviewed. No MCP setup, provider installation or target analysis was performed here.
