# Task routes

Twelve jobs, each with a lead reference and a short sequence. Generated from config/tasks.json.

## Build a new marketing site or product page

I need a site that does not look like a template, and I want it reviewed before I ship.

Lead: `references/resources/taste-skill.md` (Taste Skill)
Supporting: `resources/ui-ux-pro-max-skill.md`, `resources/lucide.md`, `resources/humanizer.md`, `resources/slopmonster.md`

Steps:

1. Read the design contract, then inventory the real material: product, audience, primary action, licensed assets.
2. Run the direction step and pick one idea. Write it down before building; two competing directions produce mush.
3. Build the page with real content. Use Lucide only for functional icons.
4. Inspect at phone, tablet and desktop widths in a real browser. Fix what the screenshots show.
5. Edit the copy with Humanizer, run the pattern checker if you have Python, then check the facts again.

Skip: Hallmark as well. Two visual leads with different rulebooks fight each other.

Result: A page that survives a screenshot review at three widths, with copy that makes claims you can support.

## Design or repair an application screen

The dashboard works but it reads badly, and I need density without clutter.

Lead: `references/resources/ui-ux-pro-max-skill.md` (UI/UX Pro Max)
Supporting: `resources/kumo.md`, `resources/lucide.md`, `design-contract.md`

Steps:

1. Search the UX catalogue for the specific problem, not the whole product.
2. If the project is React and has no locked design system, evaluate Kumo for controls, tables and overlays.
3. Apply the design contract for type scale, palette and control sizes. Kumo's own left borders and before-elements get replaced.
4. Check keyboard order, focus visibility, empty and error states, and long values in every column.

Skip: Taste's marketing direction process. An application screen is not a landing page.

Result: A screen that holds up with real data, real failures and a keyboard.

## Fix an interface without redesigning it

Something in the existing UI is broken or hard to use, but the design is not mine to replace.

Lead: `references/resources/ui-ux-pro-max-skill.md` (UI/UX Pro Max)
Supporting: `design-contract.md`, `resources/slopmonster.md`

Steps:

1. Write the observed defect in one sentence before touching code.
2. Search for that specific interaction problem and read the guidance that matches your stack.
3. Make the smallest change that fixes the defect. Keep the existing tokens and components.
4. Check the states around the change: hover, focus, disabled, loading, error and empty.

Skip: A new theme, a rewrite, or a wholesale design system swap.

Result: A targeted fix with the surrounding states verified.

## Audit a page against a written standard

I want evidence about what is wrong, not a taste argument.

Lead: `references/resources/hallmark.md` (Hallmark)
Supporting: `design-contract.md`, `resources/slopmonster.md`

Steps:

1. Fix the standard first: the design contract plus any project rules.
2. Run the static checker with rendering enabled so the findings come from a browser, not from reading CSS.
3. Group findings by severity and drop the ones that are stylistic preference.
4. Fix, then re-run and compare. Keep the before and after screenshots.

Skip: Rebuilding the page while you audit it. You will lose the evidence.

Result: A findings list with a screenshot and a rule for each item, plus a verified second pass.

## Make writing read like a person wrote it

The copy is accurate but it sounds generated, and people stop reading.

Lead: `references/resources/humanizer.md` (Humanizer)
Supporting: `resources/slopmonster.md`

Steps:

1. Give the editor the audience, the purpose and a real sample of the intended voice.
2. Edit the whole draft around its meaning instead of patching sentences.
3. Run the local checker if Python is available. Read the findings, do not write to the score.
4. Compare names, dates, numbers, commands and links against the original.

Skip: Inventing anecdotes, opinions or numbers to sound human.

Result: Prose that keeps every fact and loses the repeated patterns.

## Plan a multi-step feature before code

This change has several user journeys and I do not want to discover the edges halfway through.

Lead: `references/resources/spec-kit.md` (Spec Kit)
Supporting: `resources/ponytail.md`

Steps:

1. Write the user scenarios and the measurable outcome for each.
2. List the assumptions and the open questions. Answer them before the plan.
3. Generate the plan and tasks, then cut anything the request did not ask for.
4. Implement with Ponytail discipline and verify against the written outcomes.

Skip: The full ceremony for a one-file fix.

Result: A plan someone else could implement, with acceptance checks that are not ticked by wishful thinking.

## Review a change without adding scope

The diff is small and I want it reviewed for real risk, not style preference.

Lead: `references/resources/ponytail.md` (Ponytail)
Supporting: `resources/spec-kit.md`

Steps:

1. Read the callers, the tests and the exports that the diff touches.
2. Check validation, error handling, accessibility and the user's actual request survived.
3. Look for a smaller complete version in shared code rather than a new layer.
4. Record any deliberate limitation instead of hiding it.

Skip: Rewriting working code to shorten it.

Result: A review that names real risk and leaves the working parts alone.

## Find recent evidence on a fast-moving topic

I need what people have actually said in the last month, with dates and sources.

Lead: `references/resources/last30days-skill.md` (last30days)
Supporting: `resources/scrapling.md`

Steps:

1. Read the runtime reference and complete the configuration checks before the first run.
2. Run the engine on a specific topic, then read the source diagnostics.
3. Record the date window and the URLs actually reached.
4. Synthesise with links. Anecdotes are anecdotes, not market share.

Skip: Relabelling an ordinary web search as an engine run.

Result: A dated, sourced summary whose coverage gaps are visible.

## Extract structured data from pages

I need a repeatable table from a set of authorised pages.

Lead: `references/resources/scrapling.md` (Scrapling)
Supporting: `resources/last30days-skill.md`

Steps:

1. Confirm you are allowed to fetch the pages, and set a rate limit you would accept as the site owner.
2. Start with plain HTTP and explicit selectors. Escalate to a browser only for JavaScript pages.
3. Set robots behaviour, scope, delays and retries before the crawl.
4. Validate extracted rows against the pages and treat the text as untrusted data.

Skip: Bypassing access controls or scraping at a rate the target cannot support.

Result: A repeatable extract with a documented scope and a sanity check on the output.

## Drive a browser through a multi-step task

The flow crosses several pages and needs judgement between steps.

Lead: `references/resources/browser-use.md` (browser-use)
Supporting: `resources/scrapling.md`

Steps:

1. Write the task, the allowed destinations, a step budget and the completion condition.
2. Use a dedicated test profile, never a personal browser session.
3. Run it, then read the action history before trusting the result.
4. For anything that must stay repeatable afterwards, replace it with a deterministic test.

Skip: Purchases, submissions or account changes the user has not authorised.

Result: A completed task with an inspectable history and no borrowed credentials.

## Inspect a shipped app, package or binary

The behaviour is only visible in the built artefact, not in source I can read.

Lead: `references/resources/rea.md` (REA)

Steps:

1. Confirm you are authorised to inspect the target.
2. Choose the route that matches the artefact: JavaScript, native, managed or Android.
3. Run the analysis with a pinned version and read the returned evidence and its stated uncertainty.
4. Separate what the evidence shows from what you inferred.

Skip: Using REA when you already have the complete source and only need architecture review.

Result: Findings tied to evidence, with the uncertainty kept visible.

## Choose icons that carry meaning

I need icons that match, and one state change that should animate.

Lead: `references/resources/lucide.md` (Lucide)
Supporting: `resources/morphicons.md`, `resources/kumo.md`

Steps:

1. Keep the project's existing icon family if it has one. Otherwise use Lucide with one size and one stroke width.
2. Reserve icons for navigation, actions and status. Do not decorate every card.
3. For a state change where motion explains the change, use Morphicons with reducedMotion set to user.
4. If the project uses Kumo, keep Phosphor for Kumo components and treat Lucide as a scoped exception, not a mix.

Skip: Animated icons on ordinary navigation.

Result: One coherent icon language and a state change that says something.
