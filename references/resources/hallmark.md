Hallmark is a design workflow built around themed materials, page anatomy tied to what the visitor came to do, hero-first review and explicit preservation rules for redesigns.

## What it does

The workflow separates three classes of check: Floor rules that must pass, Reflex rules that can be overridden with a reason, and Finish observations that do not block. Themes come with their own materials, type treatments and layout habits.

`scripts/sloplint.mjs` reads HTML, CSS and component formats, understands page, component and app scopes, and supports `--before` and `--kept` checks for redesigns. Those flags compare a page against its earlier state so that content and behaviour are not silently dropped.

## How to use

```sh
npx skills add nutlope/hallmark -g
```

In a compatible host: `/hallmark <brief>`, `/hallmark audit <path>` or `/hallmark redesign <path>`. To run the checker directly, point `HALLMARK` at `skills/hallmark`:

```sh
node "$HALLMARK/scripts/sloplint.mjs" ./src --render
```

Read the workflow before choosing a theme. Build and review the hero before filling the rest of the page. On a redesign, record what already works, then confirm that links, fields, handlers and copy survived the change.

## When to use it

A new site where structured visual QA helps, or an audit and redesign that someone explicitly scoped. Hallmark's themes and Taste's house rules can contradict each other, so pick one as the visual lead and record the choice rather than merging both rulebooks.

## Limits

Node 18+ for static checks; Chrome and `puppeteer-core` for rendered checks. Fresh-context review needs a reviewer that is actually independent; a critique inside the same thread is a fallback, not the same thing. The reference photo library carries links and licence metadata, not permission to claim that a stock photo shows the customer.

The intentionally bad fixture produced 24 failures, 15 Reflex findings and 4 warnings with exit code 1 during this review. That is the checker detecting a known-bad page, not proof that a complete test suite passes. No site was built with Hallmark here.
