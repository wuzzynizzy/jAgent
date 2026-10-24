This is the design system the library uses, written so a resource cannot quietly override it. When a skill's house style, a component library default or a theme conflicts with a rule here, this file wins.

The reference is a measured public site, Freebuff, inspected in Chromium at desktop, tablet and phone widths. Measurements were taken from the live page rather than estimated from screenshots. The typography, spacing and control sizes below are adapted from it for a reading-and-retrieval interface.

## Typography

One family: Google Sans, self-hosted as a subset WOFF2 with the SIL Open Font License kept beside it. System UI fonts are a fallback for the first paint, never the intended face. Code and file paths use a system monospace stack because the mono role here is technical, not decorative.

| Role | Size | Weight | Line height | Tracking |
| --- | --- | --- | --- | --- |
| Page title | `clamp(34px, 4.4vw, 52px)` | 500 | 1.06 | -0.04em |
| Section heading | `clamp(24px, 2.6vw, 32px)` | 500 | 1.14 | -0.02em |
| Subheading | 20px | 500 | 1.3 | -0.01em |
| Interface text | 15px | 400 | 1.5 | 0 |
| Reading text | 17px | 400 | 1.62 | 0 |
| Label | 13px | 500 | 1.4 | 0.01em |
| Code | 13.5px | 400 | 1.6 | 0 |

The reference site's hero reaches 60px at desktop. A library page does not need a hero at that scale, so the title stops at 52px and reading text runs slightly larger than the reference's 15px paragraphs. Line length is capped near 72 characters for prose.

## Palette

Measured contrast against the surface each colour is used on, calculated from the hex values:

| Token | Value | Role | Contrast |
| --- | --- | --- | --- |
| canvas | `#1c1d1c` | page background | |
| surface | `#222423` | cards, panels, code blocks | |
| raised | `#282a29` | menus, active rows, inputs | |
| line | `#2f322f` | borders and dividers | |
| text | `#dedfdd` | body and headings | 12.65:1 on canvas |
| muted | `#a0a39f` | secondary text and metadata | 6.63:1 on canvas, 6.12:1 on surface |
| action | `#b5cea5` | primary action, links, focus states | 9.93:1 on canvas |
| on-action | `#1c211b` | text on the action colour | 9.62:1 on action |
| focus | `#cfe3bd` | focus outline | 12.38:1 on canvas |
| alert | `#f0a8a0` | errors and destructive notes | 8.71:1 on canvas |

Links are underlined in body text so colour is never the only signal. Focus outlines are 2px with a 2px offset and never removed. Status is written as words.

## Layout and spacing

The content container is 1040px with 64px total gutter above 760px and 40px below it. The base spacing unit is 4px; the steps in use are 4, 8, 12, 16, 24, 32, 48 and 64px. Section gaps are 64px on desktop, 40px at intermediate widths and 22px when stacked.

The sidebar takes 248px at 1024px and wider, collapses to a horizontal bar with a disclosure control below that, and the page never scrolls sideways at 320px.

## Controls

Primary buttons are 46px tall with 18px horizontal padding, 14px radius and 200ms colour feedback. Secondary controls use the raised surface and the same height. Text inputs are 44px tall with a visible border and a 14px radius. The smallest interactive target in the interface is 40px; most are 44px or larger.

Radius is 14px for controls and 18px for panels. Shadows are not used as a substitute for a border.

## Motion

Colour and background feedback run at 140ms for navigation and 200ms for buttons. Content that appears on load fades up 6px over 480ms with `cubic-bezier(.2,.7,.2,1)`. Nothing loops, nothing pulses and no element animates while idle.

`prefers-reduced-motion: reduce` removes the entrance transform and sets every transition to 0.01ms, including the ones added by scripts.

## Rules this library enforces

- No live, pulsing or online dots. Status is text with a real source.
- No authored `::before` or `:before` content anywhere, and no substitute built from `::after`, extra spans, background images or inline SVG.
- No left accent bars on cards, quotes, callouts, list items or active navigation. Selection is shown with surface, weight and a text label.
- No decorative eyebrows, kicker pills or tracked uppercase labels above headings.
- No filler copy, invented metrics, fictional testimonials or empty controls.
- Icons are functional only, drawn with consistent stroke weight, and never used as bullets or decoration.

A library that ships these rules has to survive its own scan: the build rejects `::before` content, accent borders on nav or cards, and status dot markup in its own output.
