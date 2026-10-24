UI/UX Pro Max is a local, searchable UX knowledge base with a design-system generator. It answers narrow questions with catalogued guidance instead of inventing advice at request time.

## What it does

The skill ships CSV data and Python search code covering styles, product types, colour, typography, accessibility, interaction, charts and stack-specific implementation. Three modes matter: a design-system run for a new product, a domain search for one specific problem, and a stack search for how to implement a decision.

Search output is a starting point. During this review an icon-accessibility query returned useful guidance next to weaker catalogue entries, so ranking still needs a human or agent to judge fit.

## How to use

Point `SEARCH` at the absolute `src/ui-ux-pro-max/scripts/search.py` path in a clone:

```sh
python "$SEARCH" "internal analytics dashboard" --design-system -p "Operations"
python "$SEARCH" "error summary validation" --domain ux
python "$SEARCH" "form validation" --stack react
```

To keep a design-system result, add `--persist --output-dir <project-root>`. That writes `design-system/<project-slug>/MASTER.md`. Page overrides use `--page`. Read existing files first and do not use `--force` to overwrite earlier decisions without agreement.

## When to use it

Any task that changes layout, visual presentation, motion or interaction. Ask one dominant question with a few meaningful terms. If the top result does not fit, narrow the query once before moving on.

## Limits

Python 3 only; local search needs no model API. A recommended font, style or icon family does not override an existing brand, this library's [design contract](page:design-contract) or real accessibility requirements.

Skip it for backend-only work. No dependency installation or full test run happened during this review; the searches described above were executed against the snapshot.
