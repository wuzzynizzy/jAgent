Lucide is an icon family with framework packages, consistent geometry and tree-shakable imports. It is the default choice here for functional icons: navigation, actions, and state that a label alone would make slow to scan.

## What it does

The project publishes one SVG set with per-framework packages and an icon-data format that supports named imports. `packages/lucide-react/src/Icon.ts` and `createLucideIcon.ts` handle icon-data conversion, forwarded refs and shared rendering. Parts of the React API accept both newer icon objects and legacy icon nodes, so the installed version and the documentation you read must match.

## How to use

```sh
npm install lucide-react
```

```tsx
import { Search } from 'lucide-react';

<button type="button" aria-label="Search">
  <Search size={20} strokeWidth={1.75} aria-hidden="true" />
</button>
```

Use named imports, one stroke width and one size scale, and colour through tokens. Label the control: an icon on its own is not an accessible name. For self-contained HTML, inline the individual licensed SVG instead of shipping the whole set.

## When to use it

When the project has no suitable icon family. Do not mix icon styles or weights inside one interface, and do not turn icons into decoration on every card.

## Limits

Ordinary package and bundler integration. The licence is ISC, and the pinned `LICENSE` file states it plainly even though GitHub's licence detector reports NOASSERTION. Retain the notice if you redistribute the icons.

No package build or rendered accessibility test was run during this review. Icon meaning is a product decision, not a library feature.
