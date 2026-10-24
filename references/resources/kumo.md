Kumo is Cloudflare's React component system: styled components on Base UI, semantic colour tokens, a component registry and installable blocks. It is a good fit for application screens such as forms, tables, navigation, overlays and dashboards.

## What it does

The package ships components, a theme layer built on CSS custom properties and documentation tooling. Colour roles are semantic (`bg-kumo-base`, `text-kumo-default`, `border-kumo-line`) and light and dark mappings use `light-dark()` with documented mode attributes.

The captured `packages/kumo/package.json` reports version 2.15.0. That is a property of the pinned snapshot, not a promise about the current release.

## How to use

Check the installed release's peer requirements before adding it to an existing project:

```sh
pnpm add @cloudflare/kumo
pnpm add react react-dom @phosphor-icons/react
```

Without Tailwind, use the precompiled stylesheet:

```tsx
import { Button } from '@cloudflare/kumo/components/button';
import '@cloudflare/kumo/styles/standalone';
```

With Tailwind v4, add the package to source scanning and keep the import order from the documentation:

```css
@source "../node_modules/@cloudflare/kumo/dist/**/*.{js,jsx,ts,tsx}";
@import "@cloudflare/kumo/styles/tailwind";
@import "tailwindcss";
```

Kumo portals floating UI to `document.body`. The installation guide recommends `isolation: isolate` on the app root, not on `body`, so that your own content cannot cover a portalled popup. Test dialogs, focus return, escape handling and scroll behaviour instead of raising z-index values until the symptom disappears.

Component documentation is available from the CLI:

```sh
npx @cloudflare/kumo ls
npx @cloudflare/kumo doc Button
```

## Conflicts with this library's rules

Kumo's defaults are not automatically approved here:

- `TableOfContents` uses a left border with a brand colour on the active item, and its title is uppercase and tracked. Replace both with the [design contract](page:design-contract) treatment.
- Sidebar, table and radio sources contain Tailwind `before:` utilities. Some of those support selection surfaces or hit areas rather than decoration. Check the component and state you actually use, then adapt it without inventing a replacement decoration.
- Documentation example copy is illustrative. Do not ship "Welcome to Kumo", invented worker names or sample metrics.
- Compact variants need target-size and keyboard testing in your own layout. A library's accessibility baseline does not make every composed screen compliant.

Never add a global pseudo-element suppression rule. If a component cannot meet the rules safely, choose another implementation.

## When to use it

Suitable React applications, especially those where the calm application look is wanted and the existing design system does not already govern the interface. Do not migrate a working stack only to use it, and do not force it onto a static marketing page.

## Limits

React 18 or 19, React DOM and Phosphor icons as peers, with `echarts` and `zod` optional. Kumo uses Phosphor internally, so mixing Lucide and Phosphor in one app is a deliberate exception, not a default.

No dependency installation, package build, rendered accessibility test or test-suite run happened during this review. Icon changes are scoped to Kumo apps; [Lucide](page:lucide) remains the default elsewhere.
