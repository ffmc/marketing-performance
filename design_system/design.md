---
version: alpha
name: Fieldnote Ledger
description: Editorial, sentence-led data story for Fieldnote marketing performance, built with Observable Framework and D3.
colors:
  background:    "#F6F5F8"
  surface:       "#FFFFFF"
  surfaceSunken: "#EEECF2"
  border:        "#E1DEE7"
  grid:          "#EBE9F0"
  textPrimary:   "#311847"
  textSecondary: "#4E4560"
  textMuted:     "#6B6478"
  accent:        "#311847"
  accentText:    "#311847"
  focusRing:     "#311847"
  markMuted:     "#948FA3"
  onAccent:      "#FFFFFF"                     # text on amethyst fills (ERD table headers)
  scrimDark:     "rgb(49 24 71 / 0.82)"        # label tooltip surface: the text colour at 82%
  scrimLight:    "rgb(255 255 255 / 0.86)"      # chart tooltip surface
  success:       "#1F7A4D"
  danger:        "#B42318"
  warning:       "#A15C00"
  channel:          # mark colours, validated as a set (adjacent CVD ΔE >= 8, >= 3:1 on surface) in this order
    webinar:     "#3581B8"
    paidSearch:  "#EC4067"
    event:       "#7C4DB0"
    content:     "#CC7620"
    partner:     "#A01A7D"
    email:       "#3C96BF"
  channelText:      # same hues stepped for text, >= 4.5:1 on background and surface
    webinar:     "#28699A"
    paidSearch:  "#C42A52"
    event:       "#6A3D9C"
    content:     "#8F4F0A"
    partner:     "#A01A7D"
    email:       "#1F6F93"
typography:
  fontFamily:
    display: "Schibsted Grotesk"
    body: "IBM Plex Sans"
    data: "IBM Plex Mono"
  ratio: "1.25 (majorThird)"
  scale:
    xs:   { size: 0.75rem,  lineHeight: 1.45, weight: 400, letterSpacing: 0,       family: body }
    sm:   { size: 0.875rem, lineHeight: 1.45, weight: 400, letterSpacing: 0,       family: body }
    base: { size: 1rem,     lineHeight: 1.5,  weight: 400, letterSpacing: 0,       family: body }
    lg:   { size: 1.25rem,  lineHeight: 1.3,  weight: 700, letterSpacing: -0.01em, family: display }
    xl:   { size: 1.563rem, lineHeight: 1.2,  weight: 700, letterSpacing: -0.02em, family: display }
    2xl:  { size: 1.953rem, lineHeight: 1.1,  weight: 700, letterSpacing: -0.025em, family: display }
    3xl:  { size: 2.441rem, lineHeight: 1.05, weight: 700, letterSpacing: -0.03em, family: display }
    4xl:  { size: 3.052rem, lineHeight: 1.05, weight: 800, letterSpacing: -0.03em, family: display }
    data: { size: 0.75rem,  lineHeight: 1.3,  weight: 400, letterSpacing: 0,       family: data }
  weight:   { regular: 400, medium: 500, semibold: 600, bold: 700, heavy: 800 }
  leading:  { tight: 1.1, snug: 1.25, body: 1.45, relaxed: 1.5 }
  tracking: { tag: 0.04em, label: 0.06em, eyebrow: 0.08em }
spacing: { 0: 2px, 1: 4px, 2: 8px, 3: 12px, 4: 16px, 5: 24px, 6: 32px, 7: 48px, 8: 80px }
radius:  { micro: 2px, mark: 4px, inner: 6px, control: 10px, panel: 14px, card: 20px, pill: 999px }
border:  { hairline: 1px, strong: 2px }
stroke:  { fine: 0.75px, hairline: 1px, regular: 1.5px, strong: 2px, heavy: 3px }   # SVG marks, rules and links
opacity: { faint: 0.12, subtle: 0.25, dimmed: 0.35, muted: 0.5, strong: 0.75, solid: 0.95 }
size:
  hit: 44px            # minimum interactive target
  control: 36px        # chips, icon buttons
  controlSm: 32px      # segmented options, close buttons
  tableHead: 56px
  icon: 18px           # definition trigger
  mark: 22px           # brand mark
  swatch: 12px
  swatchLg: 16px
  dot: 10px
  dotSm: 5px           # dot-strip marks
  dotMd: 7px           # sparkline endpoint
  chevron: 8px
  markMin: 4px         # scatter radius range
  markMax: 15px
  markMaxPhone: 11px
  tipMin: 210px
  tipMax: "min(280px, 70vw)"
  popover: "min(640px, calc(100vw - 32px))"
  popoverHeight: "min(70vh, 640px)"
  tableMax: "min(520px, 70vh)"
  tableMinPhone: 880px
  erdMinPhone: 760px
  search: 420px
  searchBasis: 260px
  columnMin: 260px
  sparkWidth: 160px
  sparkHeight: 36px
shift:   { sm: 2px, md: 4px, lg: 6px }   # hover lift and entry travel
z:       { sticky: 1, chartTip: 3, filters: 5, label: 6, header: 8, safeArea: 10, popover: 20 }
effects: { blur: 8px, glow: 3px }
elevation:
  sm:   "0 1px 2px rgb(49 24 71 / .05), 0 8px 24px -12px rgb(49 24 71 / .12)"
  md:   "0 24px 48px -16px rgb(49 24 71 / .35)"   # floating document panel
  node: "0 6px 14px rgb(49 24 71 / .10)"          # ERD table cards
motion:
  fast: 120ms     # hover emphasis, dimming
  ui:   180ms     # controls, toggles, fades
  data: 520ms     # marks moving to new values after a filter or model change
  draw: 800ms     # one-time draw-in when a chart first scrolls into view
  stagger: 60ms   # delay between neighbouring marks, rows or ERD tables
  lead: 380ms     # ERD links start drawing after the tables have entered
  flow: 900ms     # one cycle of the dots travelling along a highlighted ERD link (hover only)
  easeOut: "cubic-bezier(.2,.7,.2,1)"
  easeInOut: "d3.easeCubicInOut (row re-sorting only)"
breakpoints: { phone: 640px, tablet: 900px, wide: 1100px }   # documentation only: custom properties cannot be used in media queries
layout:
  maxWidth: 1240px
  gutter: "max(16px, env(safe-area-inset-*))"
  sectionGrid: "5fr / 7fr (copy / chart), single column below 900px"
  measure: { body: 52ch, footnote: 72ch, hero: 26ch }
components:
  filterBar:
    variants: [default]
    states: [resting, scrolled]
    tokens: { background: "{colors.background} at 92%", border: "{colors.border}" }
  chip:
    variants: [all, channel]
    states: [default, hover, pressed, focus]
    tokens: { background: "{colors.surface}", text: "{colors.textSecondary}", swatch: "{colors.channel.*}", radius: "{radius.pill}", minHeight: 36px, hitArea: 44px }
  segmentedControl:
    variants: [default]
    states: [default, hover, checked, focus]
    tokens: { track: "{colors.surfaceSunken}", thumb: "{colors.surface}", radius: "{radius.control}", minHeight: 32px, hitArea: 44px }
  kpiTile:
    variants: [strip]
    states: [default, updating]
    tokens: { value: "{typography.scale.2xl}", decimals: "{colors.textMuted}", spark: "{colors.accent}", deltaUp: "{colors.success}", deltaDown: "{colors.danger}" }
  definitionPopover:
    variants: [default]
    states: [hidden, visible]
    tokens: { trigger: "{size.icon}", hitArea: "{size.hit}", tooltip: "tooltip.label" }
  iconLink:
    variants: [link, panelToggle]
    states: [default, hover, focus, expanded]
    tokens: { size: "{size.control}", color: "{colors.textSecondary}", hoverBackground: "{colors.surfaceSunken}", radius: "{radius.control}", tooltip: "tooltip.label" }
  documentPanel:
    variants: [metrics, brief]
    states: [hidden, visible]
    tokens: { background: "{colors.surface}", border: "{colors.textPrimary}", radius: "{radius.panel}", shadow: "{elevation.md}", width: "{size.popover}", maxHeight: "{size.popoverHeight}", layer: "{z.popover}" }
  stageCard:
    variants: [button, final]
    states: [default, hover, focus, expanded]
    tokens: { background: "{colors.surface}", border: "{colors.border}", expandedBorder: "{colors.textPrimary}", expandedBackground: "{colors.surfaceSunken}", radius: "{radius.panel}", lift: "{shift.sm}" }
  erdDiagram:
    variants: [tables, marts]
    states: [resting, hovering]
    tokens: { header: "{colors.textPrimary}", headerText: "{colors.onAccent}", body: "{colors.surface}", link: "{colors.textPrimary}", dimmed: "{opacity.dimmed}", radius: "{radius.control}", shadow: "{elevation.node}", glow: "{effects.glow}", canvas: "{colors.background}" }
  sectionHeadline:
    variants: [hero, sectionTitle, sectionSentence]
    states: [default]
    tokens: { hero: "{typography.scale.4xl}", sectionTitle: "{typography.scale.3xl}", sectionSentence: "{typography.scale.xl}", number: "{colors.accentText}", channelName: "{colors.channelText.*}" }
  sectionPanel:
    variants: [default]
    states: [default]
    tokens: { background: "{colors.surfaceSunken}", radius: "{radius.card}", padding: "{spacing.7}", paddingPhone: "{spacing.5}" }
  legend:
    variants: [categorical, size]
    states: [default, deselected]
    tokens: { text: "{colors.textPrimary}", size: "{typography.scale.sm}", swatch: 12px }
  tooltip:
    variants: [chart, label]
    states: [hidden, visible]
    tokens: { chartBackground: "{colors.scrimLight}", chartBorder: "{colors.border}", labelBackground: "{colors.scrimDark}", labelText: "{colors.background}", radius: "{radius.control}", blur: "{effects.blur}", shadow: "{elevation.sm}", layer: "{z.chartTip} | {z.label}" }
  dataTable:
    variants: [scrolling]
    states: [default, rowHover, sorted, empty]
    tokens: { background: "{colors.surface}", border: "{colors.textPrimary}", header: "{colors.surfaceSunken}", rowDivider: "{colors.grid}", radius: "{radius.panel}", maxHeight: "{size.tableMax}", minWidthPhone: "{size.tableMinPhone}", numbers: "{typography.fontFamily.data}" }
  searchInput:
    variants: [default]
    states: [default, focus, filled]
    tokens: { background: "{colors.surface}", border: "{colors.border}", focusBorder: "{colors.textPrimary}", radius: "{radius.control}", minHeight: 44px }
  trustBadge:
    variants: [passing, failing]
    states: [default]
    tokens: { background: "{colors.surface}", icon: "{colors.success} | {colors.danger}", radius: "{radius.pill}" }
---

# Fieldnote Ledger Design System

## How to build with this
> Read this file before building any UI. `design_system/design.md` is the single source of truth; `design.html`
> and the token file are generated from it — edit this file, then regenerate them, never the reverse.
> Bind every visual value to a token (`var(--…)` / the stack's binding); never hardcode a hex/px that
> has a token. Use only the variants and states listed per component — the lists are CLOSED. If a
> feature needs a token, variant, or component that isn't defined here, STOP and flag the user, then add
> it to this file deliberately — do not improvise it. Honor the Do's and Don'ts; avoid the named clichés.
> Scope: colours, type, spacing, radii, borders, strokes, opacities, sizes, layers, movement distances and
> motion are tokens. Chart geometry internal to one component (plot margins, row heights, band padding) is not.
> Breakpoints (640, 900 and 1100px) are documented here but written literally, because custom properties
> cannot be used in media queries.

## Overview
A public, single-page data story about which Fieldnote campaigns create pipeline that closes. The audience is a hiring manager or analytics lead arriving from a LinkedIn post, often on a phone, who should understand the project in two minutes and then want to explore. Each section opens with a headline sentence computed from the data, so the reader gets the finding before the chart. The page should feel like a well-edited financial report: calm, exact, and confident enough to state a conclusion. It must never look like a SaaS admin template or an AI-generated landing page.

## Colors
Light theme only. Neutrals lean cool, with a faint lavender cast, and the text colour is the palette's dark amethyst, so the page reads as one family instead of black on white. The dark amethyst is the single UI accent: sparklines, neutral bars, headline numbers (in the darker `accentText` step so they meet 4.5:1) and nothing else. It is never a channel colour. The six channel colours encode identity only, in a fixed order that passed the CVD validator for adjacent pairs; every channel has a separate text step that meets 4.5:1, so a channel name can be written in its colour. When the reader selects channels, unselected channels fall back to `markMuted`. Status colours (success, danger, warning) are reserved for deltas, test results, stage regressions and stalled deals, and always appear with an icon, a sign or a text label. `onAccent` is white and is used only for text on amethyst fills. `scrimDark` and `scrimLight` are the translucent tooltip surfaces; no other element uses transparency as a surface.

## Typography
Schibsted Grotesk, drawn for a news publisher, carries headlines and big numbers: it reads as journalism and makes the sentence-led layout work. IBM Plex Sans sets body text, controls and tables. IBM Plex Mono sets axis ticks, tooltip values and table numbers, with tabular figures so numbers don't shift width as they count. The scale uses a 1.25 ratio. `4xl` is only for the hero sentence, `2xl` for section headlines and KPI values, `lg` for sub-headings inside a section. Display sizes get negative tracking; uppercase eyebrows get `tracking.eyebrow`, small chart titles `tracking.label` and ERD key tags `tracking.tag`. Weights come from `weight` (regular 400, medium 500, semibold 600, bold 700, heavy 800) and chart text uses only the `xs` (12px) and `sm` (14px) steps, so no chart or table label sits between two steps.

## Layout
One column of sections inside a 1240px container with a fluid gutter. Each section is a 5/7 grid: sticky copy on the left, chart on the right; full-width children (tables) span both columns. Below 900px everything stacks. Spacing uses a 4px base; gaps inside a group are 8 to 16px, between groups 24 to 32px, and between sections 80px, so sections read as chapters. Running text is held to 52ch, footnotes to 72ch, the hero sentence to 26ch.

## Elevation & Depth
Almost flat. Surfaces separate with a 1px border plus one soft shadow tinted with the text colour. `elevation.sm` is used on tooltips, the segmented control thumb, stage cards and the table; `elevation.md` only on the floating document panel; `elevation.node` only on ERD table cards. Two effects are allowed and nothing else: tooltips blur what is behind them (`effects.blur`), and the one ERD link the reader is pointing at glows (`effects.glow`). No other element uses blur, glow or a gradient.

## Shapes
Radius varies by role. Hairline details use `micro` (2px) and data marks use `mark` (4px, bar ends rounded toward the value). Options inside a segmented control use `inner` (6px, the control radius minus its padding). Controls, tooltips and ERD tables use `control` (10px). Panels like the table use 14px. Pills (chips, trust badge, delta) are fully round. Each analysis sits in one quiet grey panel (`sectionPanel`, radius `card`) that holds its title, sentence and charts together, so the reader sees where one question ends and the next begins. A border marks something you can interact with or scroll, never a section.

## Components
**Filter bar.** Sticky under the safe-area inset. Holds the country segmented control and the channel chips, which scroll horizontally on a phone. It is the only global control; every chart, number and sentence responds to it.

**Chip.** Multi-select channel toggle with a colour swatch. Pressed shows a border in the channel colour. "All channels" clears the selection; selecting all six also clears it.

**Segmented control.** Single choice among 2 to 4 options (country, attribution model). The checked thumb is the surface colour with `elevation.sm`.

**KPI tile.** Label with a definition popover, value in display type with decimals and unit dimmed (`€4` + `.82M`), a delta pill against the prior period, and a sparkline with an area fill and an emphasised endpoint. Values count up on first view and tween on filter changes.

**Definition popover.** An 18px "i" trigger with a 44px hit area. Shows the metric's definition from `docs/metrics.md` in a label tooltip on hover or focus.

**Icon link.** A 36px icon button in the masthead's top right: GitHub and LinkedIn are links, "Metric definitions" and "The brief" toggle a document panel. Each shows a label tooltip on hover or focus, below the icon. The expanded icon keeps the hover background and hides its tooltip.

**Document panel.** Opens under the icon links when the reader clicks Metric definitions or The brief. It renders the repository's `docs/metrics.md` or `docs/brief.md` at build time, scrolls inside `size.popoverHeight`, closes with its button, Esc or a click outside, and links to the source on GitHub. Clicking the other icon switches document.

**Section panel.** One flat `surfaceSunken` panel per analysis, 48px padding (20px on a phone), no border and no shadow. Tables, search fields and tooltips inside it stay on `surface` so they read as controls. The hero is not in a panel.

**Section headline.** Each analysis has a large section title (`3xl`, display, 800: "Funnel", "Spend efficiency") above a sentence (`xl`) built from live data. Numbers use `accentText`; channel names use their `channelText` colour. It must stay true for every filter combination.

**Legend.** Above the chart, `sm` text in `textPrimary`, 12px swatches. Deselected channels fade to 45%.

**Tooltip.** Two variants, both translucent with a `blur`, both `radius.control`. The `chart` variant is light (`scrimLight`, border, `elevation.sm`), follows the hovered mark, flips to stay inside the chart and shows a title plus a two-column value list in Plex Mono. The `label` variant is dark (`scrimDark`, `labelText`), is anchored to its trigger, and holds a sentence of `xs` body text: definition popovers and icon links share one rule and one fade. The class name `tip` is reserved by Observable Framework, so the chart variant is `chart-tip`.

**Stage card.** One of five buttons in "How it's built" (Salesforce, Snowflake RAW, Silver, dbt) plus the final "This page" card. A note above them says "Click a stage to see the tables and models behind it." The open card shows a chevron and the sunken background. Clicking opens the panel below the row and a second click closes it.

**ERD diagram.** Opens under the stage cards. Table cards have an amethyst header with `onAccent` text, a white body, `radius.control` corners and `elevation.node`, and list primary keys and foreign keys. Links join the foreign-key row to the key it references, with a crow's foot on the many side and a bar on the one side, on a dotted `background` canvas (the one patterned background allowed). Hovering a table makes its links bold and glowing, sends dots along them (the one looping animation, hover only), bolds the key rows involved, and dims everything else to `opacity.dimmed`. Tables enter in sequence, then links draw. Below `phone` the diagram scrolls sideways.

**Data table.** Scrolls vertically inside a 520px panel with a sticky header on `surfaceSunken`; the panel has a `textPrimary` border and 24px side padding. Columns sort on click with `aria-sort`; numbers right-aligned in Plex Mono; text columns wrap so the table never scrolls sideways above `tablet`, and below it the table keeps `tableMinPhone` and scrolls sideways. Hovering a row highlights the matching mark in the chart above. Empty state names the filter that caused it. A column may set its own width.

**Search input.** Filters the table and dims non-matching marks in the related chart.

**Trust badge.** Refresh date and dbt test result in the masthead. Passing uses `success` with a check icon; failing uses `danger` with a cross and keeps showing the last good refresh date.

**Charts.** Marks: 2px lines, dots at least 8px across with a `stroke.fine` `textPrimary` outline and `opacity.strong` fill so overlapping dots stay readable (solid on hover), bars with 4px rounded value ends and 2px gaps. Every chart with axes draws an axis line and tick marks in `textPrimary` (the same colour as the table border); gridlines stay in `grid`, horizontal only. One y-axis per chart, never two. Axis tick labels are 12px Plex Mono in `textSecondary`. Every chart with two or more series has a legend, a hover layer and a table or tooltip that gives exact values.

Chart choices that follow from the data: the funnel's moved-on flow is split into channel colours with a channel legend, and drop-offs stay `markMuted`; pipeline health is a column chart with moving and stalled columns side by side, stalled in `warning`, labelled "Stalled 30+ days"; "Pipeline that closes" is three bar panels (win rate, average won deal, won per euro) with one row per channel and "too few" instead of a rate under five closed deals; attribution switches between first touch, last touch and linear with the first-touch value marked by a dashed rule; speed is a strip of dots per stage pair with its median marked.

**Motion.** UI feedback uses `fast` or `ui`. Data moving to new values uses `data` with ease-out; re-sorted rows use ease-in-out. A chart draws in once (`draw`) when it first enters the viewport, starting from its final state at rest so a screenshot or link preview is never empty. `prefers-reduced-motion` sets every duration to 0 and turns off count-ups.

## Do's and Don'ts
**Do**
- Write each section headline as a finding computed from the data, and keep the chart that proves it beside it.
- Colour a channel name in its `channelText` colour wherever it appears in text.
- Recompute rates, cost-per metrics and medians from counts after every filter change.
- Give every metric label a definition popover that matches `docs/metrics.md`.
- Keep interactive targets at 44px or larger.
- Show "Not recorded" for missing costs instead of hiding the campaign.

**Don't**
- Don't use Inter, Geist, Bricolage Grotesque or Space Grotesk; they read as AI defaults.
- Don't nest panels, use coloured left-border cards, or build a 3-across icon card grid. One grey panel per analysis is the only container.
- Don't use gradients, glassmorphism or coloured glow shadows. The blurred tooltip, the glowing ERD link and the dotted ERD canvas are the only exceptions.
- Don't use the accent as a channel colour, or a channel colour as UI decoration.
- Don't add a second y-axis, a pie chart, or ring gauges.
- Don't use bounce or overshoot easing, or animations that loop. The dots along a hovered ERD link are the one exception and stop when the pointer leaves.
- Don't write a colour, a font size or weight, a radius, a duration, a z-index or an opacity as a literal in CSS or in a chart. Reference the token; if none fits, add one here first.
- Don't build a third tooltip. Use `chart` or `label`.
