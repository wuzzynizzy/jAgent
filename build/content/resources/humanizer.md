Humanizer is an editorial skill for prose that reads like a model wrote it. It targets repeated patterns: inflated significance, staged openings, forced triads, mechanical contrast and tidy closing summaries.

## What it does

The skill defines a review pass over a whole draft, plus file and embedded modes. It removes the patterns while keeping facts, names, dates, commands, citations and the author's actual position. The package ships a validator that checks its own structure and version consistency.

## How to use

Load the root `SKILL.md` in a skill-capable host, or read and apply it directly to a draft. Supply the audience, the purpose and a voice sample when one exists.

Read the whole draft, rewrite around its meaning, then compare facts, names, dates, commands, citations and links against the original. In file mode, change prose without touching code or metadata. In embedded mode, return the final text rather than narrating every edit.

## When to use it

Website copy, emails, reports, README prose and public explanations that will be read by people outside the project. Use it as an editorial pass, not as a command to make every sentence casual.

## Limits

No runtime is needed for the writing guidance. Do not invent experience, opinions for the author, metrics or citations to make prose look human. A real voice sample can justify phrasing that a generic pattern list would flag.

It is not an authorship detector and not a guarantee about how a reader or a detector will classify the text. The packaged validator passed for v3.1.0 during this review, which confirms the package layout, not the quality of an edit.
