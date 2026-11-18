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
spacing: { 1: 4px, 2: 8px, 3: 12px, 4: 16px, 5: 24px, 6: 32px, 7: 48px, 8: 80px }
radius:  { mark: 4px, control: 10px, panel: 14px, card: 20px, pill: 999px }
elevation:
  sm: "0 1px 2px rgb(49 24 71 / .05), 0 8px 24px -12px rgb(49 24 71 / .12)"
motion:
  fast: 120ms     # hover emphasis, dimming
  ui:   180ms     # controls, toggles, fades
  data: 520ms     # marks moving to new values after a filter or model change
  draw: 800ms     # one-time draw-in when a chart first scrolls into view
  easeOut: "cubic-bezier(.2,.7,.2,1)"
  easeInOut: "d3.easeCubicInOut (row re-sorting only)"
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
    tokens: { background: "{colors.textPrimary}", text: "{colors.background}", radius: "{radius.control}", trigger: 18px, hitArea: 44px }
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
    variants: [default]
    states: [hidden, visible]
    tokens: { background: "{colors.surface}", border: "{colors.border}", radius: 12px, shadow: "{elevation.sm}" }
  dataTable:
    variants: [scrolling]
    states: [default, rowHover, sorted, empty]
    tokens: { background: "{colors.surface}", border: "{colors.border}", rowDivider: "{colors.grid}", radius: "{radius.panel}", maxHeight: "min(520px, 70vh)", numbers: "{typography.fontFamily.data}" }
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

## Overview
A public, single-page data story about which Fieldnote campaigns create pipeline that closes. The audience is a hiring manager or analytics lead arriving from a LinkedIn post, often on a phone, who should understand the project in two minutes and then want to explore. Each section opens with a headline sentence computed from the data, so the reader gets the finding before the chart. The page should feel like a well-edited financial report: calm, exact, and confident enough to state a conclusion. It must never look like a SaaS admin template or an AI-generated landing page.

## Colors
Light theme only. Neutrals lean cool, with a faint lavender cast, and the text colour is the palette's dark amethyst, so the page reads as one family instead of black on white. The dark amethyst is the single UI accent: sparklines, neutral bars, headline numbers (in the darker `accentText` step so they meet 4.5:1) and nothing else. It is never a channel colour. The six channel colours encode identity only, in a fixed order that passed the CVD validator for adjacent pairs; every channel has a separate text step that meets 4.5:1, so a channel name can be written in its colour. When the reader selects channels, unselected channels fall back to `markMuted`. Status colours (success, danger, warning) are reserved for deltas, test results and stage regressions and always appear with an icon or a sign.

## Typography
Schibsted Grotesk, drawn for a news publisher, carries headlines and big numbers: it reads as journalism and makes the sentence-led layout work. IBM Plex Sans sets body text, controls and tables. IBM Plex Mono sets axis ticks, tooltip values and table numbers, with tabular figures so numbers don't shift width as they count. The scale uses a 1.25 ratio. `4xl` is only for the hero sentence, `2xl` for section headlines and KPI values, `lg` for sub-headings inside a section. Display sizes get negative tracking; uppercase eyebrows get +0.08em.

## Layout
One column of sections inside a 1240px container with a fluid gutter. Each section is a 5/7 grid: sticky copy on the left, chart on the right; full-width children (tables) span both columns. Below 900px everything stacks. Spacing uses a 4px base; gaps inside a group are 8 to 16px, between groups 24 to 32px, and between sections 80px, so sections read as chapters. Running text is held to 52ch, footnotes to 72ch, the hero sentence to 26ch.

## Elevation & Depth
Almost flat. Surfaces separate with a 1px border plus one soft shadow tinted with the text colour (`elevation.sm`), used only on tooltips, the segmented control thumb and the table. No glows, no blur panels.

## Shapes
Radius varies by role. Data marks use 4px (bar ends, rounded toward the value). Controls use 10px. Panels like the table use 14px. Pills (chips, trust badge, delta) are fully round. Each analysis sits in one quiet grey panel (`sectionPanel`, radius `card`) that holds its title, sentence and charts together, so the reader sees where one question ends and the next begins. A border marks something you can interact with or scroll, never a section.

## Components
**Filter bar.** Sticky under the safe-area inset. Holds the country segmented control and the channel chips, which scroll horizontally on a phone. It is the only global control; every chart, number and sentence responds to it.

**Chip.** Multi-select channel toggle with a colour swatch. Pressed shows a border in the channel colour. "All channels" clears the selection; selecting all six also clears it.

**Segmented control.** Single choice among 2 to 4 options (country, attribution model). The checked thumb is the surface colour with `elevation.sm`.

**KPI tile.** Label with a definition popover, value in display type with decimals and unit dimmed (`€4` + `.82M`), a delta pill against the prior period, and a sparkline with an area fill and an emphasised endpoint. Values count up on first view and tween on filter changes.

**Definition popover.** An 18px "i" trigger with a 44px hit area. Shows the metric's definition from `docs/metrics.md` on hover or focus.

**Section panel.** One flat `surfaceSunken` panel per analysis, 48px padding (20px on a phone), no border and no shadow. Tables, search fields and tooltips inside it stay on `surface` so they read as controls. The hero is not in a panel.

**Section headline.** Each analysis has a large section title (`3xl`, display, 800: "Funnel", "Spend efficiency") above a sentence (`xl`) built from live data. Numbers use `accentText`; channel names use their `channelText` colour. It must stay true for every filter combination.

**Legend.** Above the chart, `sm` text in `textPrimary`, 12px swatches. Deselected channels fade to 45%.

**Tooltip.** Follows the hovered mark, flips to stay inside the chart, title plus a two-column value list in Plex Mono.

**Data table.** Scrolls vertically inside a 520px panel with a sticky header; columns sort on click with `aria-sort`; numbers right-aligned in Plex Mono; hovering a row highlights the matching mark in the chart above. Empty state names the filter that caused it.

**Search input.** Filters the table and dims non-matching marks in the related chart.

**Trust badge.** Refresh date and dbt test result in the masthead. Passing uses `success` with a check icon; failing uses `danger` with a cross and keeps showing the last good refresh date.

**Charts.** Marks: 2px lines, dots at least 8px across with a 2px surface ring, bars with 4px rounded value ends and 2px gaps. Gridlines in `grid`, horizontal only. One y-axis per chart, never two. Axis ticks are 12px Plex Mono in `textSecondary`. Every chart with two or more series has a legend, a hover layer and a table or tooltip that gives exact values.

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
- Don't use gradients, glassmorphism or coloured glow shadows.
- Don't use the accent as a channel colour, or a channel colour as UI decoration.
- Don't add a second y-axis, a pie chart, or ring gauges.
- Don't use bounce or overshoot easing, or animations that loop.
