# DESIGN.md — VHD Summit

The visual world this site implements. It follows `design.pen` (v1.0); this file
records what was built from it, and the handful of places the build departs from
the drawing and why.

## Mode

**Persuade** on the public site — the visitor decides whether to attend, and the
design is doing that work. **Operate** in `/admin` — the editor is completing a
task, so scanability outranks expression there. The admin is not in `design.pen`
and inherits the palette only.

## Palette

`design.pen` §1, verbatim except where noted.

| Token | Value | Used for |
|---|---|---|
| `brand-600` | `#067C74` | CTA buttons, links, dark headers |
| `brand-800` | `#04564F` | Hover state, footer, every dark band |
| `brand-400` | `#62B4AF` | Icons, accent rules, badges |
| `brand-200` | `#C3E5E3` | Section backgrounds, tags, text on dark |
| `brand-100` | `#E3F1F2` | Alternating page background |
| `cream` | `#FEF4D8` | CTA on dark ground, countdown values |
| `brand-950` | `#0C2B29` | Headings and body text |
| `ink-muted` | `#4A6866` | Secondary text and captions |
| `line` | `#D7E6E6` | Card borders and dividers |

Steps 50/300/500/700/900 are interpolated so hover and border states have
somewhere to land.

**Two departures, both for contrast.** `design.pen` sets `ink-muted` to
`#5B7B79`, which is 3.98:1 on the mist background it sits on — under the 4.5:1
the same file asks for in its accessibility notes; it is darkened one step to
6.1:1 on white and 5.2:1 on mist. And the countdown unit label is drawn in
`brand-secondary`, which is 2.67:1 on the unit's own `#0A6A62` ground; it uses
`brand-200` at 4.8:1 instead.

**Contrast is measured, not estimated.** Text over photographs is judged from
rendered pixels (`scripts/qa/contrast.js`) — a computed `background-color`
cannot see a scrim over an image. Estimating from CSS reported 642 failures on
an earlier build, nearly all of them white hero text over a dark photo.

## Type

Be Vietnam Pro at 400/500/600/700 — the file names those four weights, and each
extra one is another file on the critical path. Roboto Mono carries countdown
values and agenda times so digits keep a fixed width.

| Role | Size / weight / leading |
|---|---|
| H1 banner | 48 / 700 / 1.15 |
| H2 section | 32 / 700 / 1.2 |
| H3 card title | 20 / 600 / 1.3 |
| Body | 16 / 400 / 1.6 |
| Caption | 13 / 500 / 1.5 |
| Button | 14–15 / 700 / 1.2 |

Display sizes are fluid between the mobile and desktop values rather than
stepping at a breakpoint. Prose caps at `68ch`; past about seventy characters
the eye loses the line it is returning to.

## Grid

Desktop 1440 frame · 120 side margin · 1200 content · 12 columns · 24 gutter.
Mobile 390 frame · 20 side margin · 350 content · single column. Section padding
56–88 desktop, 32–44 mobile, all through the one `section-y` utility. Radius 8
for controls, 10–12 for cards, 999 for pills.

## The rounded band

Coloured bands carry one large asymmetric corner so each block reads as a card
sliding over the next. Direction alternates down the page: heroes cut
bottom-right, the CTA band cuts top-left, footers stay square.

Built as two elements, and the reason matters: the **wrapper** is painted the
colour of the adjacent section the corner exposes, and the **inner band** carries
the radius and clips. Without the wrapper the page's white shows through the
cut, which is the whole thing the pattern is avoiding.

## Decoration

Two motifs only — concentric spotlight rings and a fading dot grid — both pure
vector, drawn in `src/components/ui/Deco.tsx`. They appear only in flat bands
that would otherwise be empty: page heroes, the countdown strip, CTA bands, the
footer. Never behind photography, never behind body copy or a form. Stroke alpha
sits near 25%: if the motif is noticeable before the headline it is too strong.
All of it is `aria-hidden`.

## Motion

One authored moment per surface. Cards lift under the pointer, agenda rows
expand, the hero carousel advances, the countdown ticks — all input-driven or
continuous, none of it an entrance animation. An earlier build faded in
fifty-five elements on scroll, which read as a template and made content depend
on an observer firing before anyone could read it.

Every transition names its properties; `transition: all` appears nowhere.
Easing is `cubic-bezier(0.22, 1, 0.36, 1)`. `prefers-reduced-motion` is honoured
globally.

## Touch and browser surfaces

Touch targets clear **44px**, pointer targets 24px. A control that must stay
visually small — the carousel bars — is a 44px button wrapping a 4px bar, so the
hit area is real rather than a pseudo-element no tool can verify. Form fields are
at least 16px or iOS zooms the page on focus. Selection, caret, focus ring
(`#067C74`, per the file), scrollbar and tap highlight are all themed.

## Images

`src/lib/image-loader.ts` decides what the server resizes:

- **Self-hosted uploads** go through Next's optimizer — few per page, and worth
  it because an editor may upload a 5MB photo.
- **CDN images pass through** with the CDN's own resize parameters. Optimizing
  seventeen partner logos on a 2-core VPS pushed the process past its memory
  ceiling; pm2 restarted it and visitors saw 502s.
- When a URL pins both `w` and `h`, the height scales with the width. Overriding
  only the width asked Unsplash for a 36×600 sliver of every speaker portrait.

A photograph under an 82–88% overlay is a **texture, not an image**: inner-page
heroes request 768px at quality 40, the home hero 100vw at quality 50, and only
the visible carousel slide plus the next one are mounted. The `deviceSizes`
ladder carries 1366 and 1600 rungs because the default jumps 1200 → 1920, which
made a hero asking for ~1400 fetch a 1920px file.

## Measured budget

Slow 4G + 4× CPU, cold, median of three (`scripts/qa/perf.js`):

| | LCP | CLS | TBT |
|---|---|---|---|
| `design.pen` target | < 1.5s | — | — |
| Budget | < 2.5s | < 0.1 | < 200ms |
| Actual | 1.10–1.43s | 0–0.001 | 80–143ms |

Anything that moves LCP past 1.5s needs a reason written down.
