SlopMonster is a local pattern checker for copy, plus an optional wrapper that sends a draft to a different model family for an independent editing pass.

## What it does

`tools/deslop.py` reads Markdown or HTML and flags vocabulary, sentence shapes, punctuation habits, triads and claims that may lack support. Each matched category lowers a five point score. `tools/cleanse.sh` wraps the optional second-model pass and separates the draft from the notes with a sentinel.

The wrapper has distinct failure behaviour: a missing rival CLI exits 127 and can print the prompt instead of an edited draft, and a timeout exits 124. Neither is a successful edit.

## How to use

```sh
python3 tools/deslop.py draft.md
python3 tools/deslop.py page.html
python3 tools/test_deslop.py
```

Read findings in context and fix the ones that matter for the audience, then compare against the original and run it again. If you use the second-model pass, review what text will be transmitted first, then check the exit status and read the output.

## When to use it

Important website copy, README prose, emails and scripts, alongside [Humanizer](page:humanizer) for the more contextual edit.

## Limits

Python for the checker, an authenticated external CLI for the independent pass. The rules are English only. A score of five means no scored pattern matched, nothing more: it does not make the text factual, well written or human. Proof warnings flag claims to check, they do not verify them.

Preserve punctuation and phrasing that earns its place instead of writing to the score. The checker's tests passed during this review; the second-model workflow was not run.
