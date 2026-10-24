browser-use drives a real browser with a model in the loop: it reads page state, chooses actions and records what happened. Use it for interactive work where a fixed script would keep breaking, not for a repeatable regression suite.

## What it does

The project combines browser state extraction, model decisions and a registered action set, then returns a result with a history. Open source and hosted routes exist with different requirements and costs. The bundled `examples/simple.py` uses `Agent`, `ChatBrowserUse` and `run_sync()` and needs a Browser Use key; that is one provider configuration, not a requirement for every integration.

## How to use

Follow the matching open-source or cloud skill for the release you install. Give the agent a narrow task, the destinations it may visit, a step budget and explicit completion criteria. Configure the model and the browser separately, run the task, then read the history and the evidence it produced.

For QA, use a dedicated test profile. Do not point an agent at your personal browsing session.

## When to use it

Multi-step browser work where page state and navigation matter, or exploration of a flow that is not yet stable enough to script.

For a stable regression suite, deterministic browser tests are cheaper and more reproducible. The agent is still useful for exploring a flow or diagnosing why a test fails.

## Limits

The captured package requires Python 3.11+ and below 4, plus browser and model dependencies. Hosted services can cost money.

A browser session can expose cookies, page contents and files to configured services. Authorisation still governs purchases, submissions, uploads and account changes; the agent does not acquire new permission by being able to click.

Browser tool availability in a host has to be verified, not inferred from a downloaded skill. No agent browser task was executed during this review.
