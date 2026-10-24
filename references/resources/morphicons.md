Morphicons animates one SVG icon into another by matching and aligning their geometry, then interpolating between the shapes. It is worth using when the change of shape carries meaning: menu to close, play to pause, copy to copied.

## What it does

The package separates geometry matching from interpolation and exposes controlled and imperative APIs alongside the declarative components. Bindings exist for React, Vue, Svelte, React Native, Astro, custom elements and plain DOM, and the geometry core can be used on its own.

One default matters more than the API: the reduced-motion policy is `never`, which means it will animate even when the operating system asks for less motion. Set `reducedMotion="user"` on every instance.

## How to use

```sh
npm install morphicons lucide
```

```tsx
import { MorphIcon } from 'morphicons/react';
import { Menu, X } from 'lucide';

<button
  type="button"
  aria-label={open ? 'Close menu' : 'Open menu'}
  aria-expanded={open}
  aria-controls="site-menu"
  onClick={() => setOpen(value => !value)}
>
  <MorphIcon icon={open ? X : Menu} reducedMotion="user" />
</button>
```

The fragment assumes the surrounding component owns `open` and `setOpen` and renders `site-menu`. Pass icon data rather than `lucide-react` components, and keep package versions aligned so the icon shape matches what the package expects.

## When to use it

State changes where the animation reinforces the meaning and the control has an accurate accessible name and state. For everything else, static [Lucide](page:lucide) icons are the simpler answer.

## Limits

ESM and the matching framework peer. A success state must follow a real success, not an optimistic animation. Handle rapid clicks, clean up imperative controllers, and keep the control's semantics outside the animation.

No morph was rendered or tested during this review.
