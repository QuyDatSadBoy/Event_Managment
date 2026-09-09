# DESIGN.md — VHD Summit

The visual world this site commits to. Read this before touching UI; it decides
the questions that would otherwise get re-litigated per component.

## Mode

**Persuade** on the public site — the visitor decides whether to attend, and the
design is doing that work. **Operate** in `/admin` — the editor is completing a
task, so scanability and consistency outrank expression there.

## Palette

One ocean-blue ramp carries everything. Cyan is the only accent; gold appears on
awards and nowhere else.

| Token | Value | Used for |
|---|---|---|
| `ocean-50 … 950` | `#edf8ff` → `#082a4d` | The whole ramp: surfaces, text, borders |
| `abyss` / `abyss-soft` | `#041c33` / `#062a4d` | Deep grounds under `surface-deep` |
| `cyan-glow` | `#22d3ee` | Accent on dark grounds, ≥18px |
| `cyan-soft` | `#6ee7f9` | Small text on dark — `cyan-glow` falls under 4.5:1 below 18px |
| `gold` | `#f5b335` | Awards and "featured" marks only |

**Contrast is measured, not estimated.** Text over photographs is judged from
rendered pixels (`scratchpad/pw/contrast.js` pattern), because a computed
`background-color` says nothing about a scrim over an image. Two rules learned
the hard way: white on `ocean-500` is 3.95:1 and fails; `ocean-600` on white is
4.4:1 at 11px and fails. Primary buttons start at `ocean-700`.

## Type

Be Vietnam Pro, weights 400/500/600/700/800 — 300 is not used and each weight is
another file on the critical path. Vietnamese diacritics are the reason for this
face; a generic geometric sans mangles them.

- Display sizes are fluid: `clamp(2.25rem, 1.2rem + 4.4vw, 4.25rem)` for the
  home h1, `clamp(1.75rem, 1.2rem + 2.2vw, 2.875rem)` for section headings.
- Tracking tightens as size grows, floor `-0.04em`.
- Prose measure caps at `68ch`. Longer lines lose the reader on the return sweep.
- Numbers that get compared use `tabular-nums`.

## Structure

Three rules that overrule habit:

1. **No kicker above a heading.** No small label announcing what the heading is
   about to say. The heading carries its own weight.
2. **Cards are not the page structure.** Four identical icon-heading-text boxes
   say nothing and cost ~1000px of scroll on a phone. Hairline-separated lists,
   grids of real content, and typographic bands instead.
3. **Numbers are the visual.** Statistics get no icon and no card each — a
   two-column grid of hairline cells reads as one object.

`section-y` is the only vertical rhythm for page sections. Two of them meeting at
a background change is the largest gap the page should ever show.

## Motion

One authored moment per surface, not an entrance on every section. Section
headings do not animate; collection grids stagger in reading order because the
stagger maps to how the eye moves through them.

- Only compositor-friendly properties. Every transition names its properties —
  `transition: all` is never used.
- Easing is `cubic-bezier(0.22, 1, 0.36, 1)` (exponential ease-out).
- `prefers-reduced-motion` is honoured in `globals.css` for every animation, and
  the reveal utility resolves to its final state there.

## Touch and browser surfaces

- Touch targets clear **44px**; pointer targets clear 24px. A control that must
  stay visually small (carousel bars) is wrapped in a 44px control rather than
  padded with a pseudo-element, so it can be verified.
- Form fields are at least **16px** — below that iOS zooms the page on focus.
- Selection, caret, focus ring, scrollbar and tap highlight are all themed from
  the palette. These ship with browser defaults that belong to no design system.

## Images

`src/lib/image-loader.ts` decides what the server does and does not resize:

- **Self-hosted uploads** go through Next's optimizer — a few per page, and worth
  resizing because an editor may upload a 5MB photo.
- **CDN images pass through**, with Unsplash's own resize parameters so the
  srcset is real. Optimizing seventeen partner logos on a 2-core VPS pushed the
  process past its memory ceiling and pm2 restarted it; visitors saw 502s.
- When a URL pins both `w` and `h`, the height scales with the width. Overriding
  only the width asked Unsplash for a 36×600 sliver of every speaker portrait.

A photograph under a 92% scrim is a **texture, not an image**: inner-page heroes
request 768px at quality 40. At full width they were the LCP element on every
page and cost 2.5–4.4s.

## Measured budget

Slow 4G + 4× CPU, cold, median of three, through Cloudflare:

| | LCP | CLS | TBT |
|---|---|---|---|
| Budget | < 2.5s | < 0.1 | < 200ms |
| Actual | 1.7–1.9s | 0 | 51–169ms |

Regressions here are design decisions, not accidents — anything that moves LCP
past 2s needs a reason written down.
