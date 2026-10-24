Taste is an art-direction skill. It pushes an agent to derive a visual idea from the actual subject, commit to one direction, then check the built page in a browser instead of trusting its own description of the work.

## What it does

The skill supplies a direction process, reference and asset discovery, a static linter and a browser inspector. The repository now ships `design-taste-frontend` as its main skill; older skills moved to separate repositories. Websites and dense app screens have separate routes, and the app route expects different rules from a marketing page.

`draw.mjs` reads the bundled direction libraries and records a chosen direction. `inspect.mjs` drives a real browser, captures screenshots, evaluates page or app rules and exits non-zero when a check fails.

## How to use

Install into a supported host:

```sh
npx skills add https://github.com/Leonxlnx/taste-skill --skill "design-taste-frontend"
```

From the recorded snapshot, point `TASTE` at the absolute `skills/taste-skill` directory and read `SKILL.md` first:

```sh
node "$TASTE/scripts/draw.mjs" --sector restaurant \
  --brief "The actual restaurant and its specific offer" \
  --sections about,gallery,contact,footer --options 3
node "$TASTE/scripts/inspect.mjs" http://localhost:3000 --out .taste-skill/inspect
```

The first command returns internal direction candidates. Pick one, then generate the full sheet as the skill describes. The inspector URL is for a browser on the same machine, not an address to publish.

For dashboards and app screens, read `references/app-screens.md` and use the `--app` route. Read [the design contract](page:design-contract) before accepting any direction, because this library's bans override the skill's own preferences.

## When to use it

New sites, portfolios, product pages, redesigns, visual reviews and app screens. The working loop is: inventory the client's own material, form the idea, build, inspect, critique the screenshots, fix.

## Limits

The browser workflow needs Node 22+ and Chrome, Edge or Chromium. Asset discovery needs network access. The skill's house preferences are guidance, not accessibility standards and not evidence about a brand you have not read. Its published design-study statistics were not reproduced here. No browser inspection was run during this review.

Do not build around invented photos, numbers or testimonials. Nothing in the skill licenses fictional proof.
