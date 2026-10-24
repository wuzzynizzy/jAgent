last30days is a research engine and agent workflow for recent discussion across social, developer, video and web sources. It reports which sources it actually reached, then synthesises with that date window attached.

## What it does

The skill drives a Python CLI that queries source adapters, writes saved research and produces a grounded summary. Source diagnostics show which adapters worked, so coverage gaps are visible instead of being smoothed over. Optional monitoring and discovery features reuse the same runs.

The captured version is 3.30.0 and requires Python 3.12+. The real entry point is under `skills/last30days/scripts/`, not a root `scripts/` directory, which is a common source of broken instructions in older notes.

## How to use

In a configured host, invoke `/last30days <specific topic>`. Before the engine runs, bind the correct skill directory, read `references/runtime.md` in full and complete the interpreter and configuration checks.

Record the date window, the sources actually reached and their URLs before writing any synthesis. If native search substitutes for the engine, label the result as ordinary web research. It is not a last30days run.

## When to use it

Fresh community evidence, tool comparisons, product complaints and emerging themes. A recent window cannot replace an authoritative historical record, and engagement counts are not market statistics.

## Limits

Python 3.12+, Node and mode-specific tools or credentials. Some sources work without paid APIs; availability changes over time. Browser-cookie access needs consent and paid backends can spend credits.

Never copy keys or cookie values into a shared library. Saving the skill does not configure any service. No live research or setup was performed during this review.
