import * as d3 from "npm:d3";

export {d3};

export const CHANNELS = ["Webinar", "Paid Search", "Event", "Content", "Partner", "Email"];
export const COUNTRIES = {ES: "Spain", GB: "the UK", US: "the US"};
const slug = (k) => k.toLowerCase().replace(/ /g, "-");
export const chVar = (k) => (CHANNELS.includes(k) ? `var(--channel-${slug(k)})` : "var(--color-mark-muted)");
export const chTextVar = (k) => (CHANNELS.includes(k) ? `var(--channel-text-${slug(k)})` : "var(--color-text-secondary)");
export const chName = (k) => `<span class="chname" style="--ct: ${chTextVar(k)}">${k}</span>`;
export const listNames = (a) => (a.length <= 2 ? a.join(" and ") : `${a.slice(0, -1).join(", ")} and ${a.at(-1)}`);

const RM = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
export const dur = (ms) => (RM ? 0 : ms);
export const EASE = d3.easeCubicOut;
export const MOTION = {fast: 120, ui: 180, data: 520, draw: 800};

export function eur(v) {
  if (v == null || !isFinite(v)) return "–";
  const a = Math.abs(v), s = v < 0 ? "−" : "";
  if (a >= 1e6) return `${s}€${(a / 1e6).toFixed(2)}M`;
  if (a >= 1e4) return `${s}€${Math.round(a / 1e3)}k`;
  if (a >= 1e3) return `${s}€${(a / 1e3).toFixed(1)}k`;
  return `${s}€${Math.round(a)}`;
}
export const ratio = (v) => (v == null || !isFinite(v) ? "–" : `${v.toFixed(1)}×`);
export const pct = (v, d = 1) => (v == null || !isFinite(v) ? "–" : `${(v * 100).toFixed(d)}%`);
export const int = d3.format(",d");
export const days = (v) => (v == null || !isFinite(v) ? "–" : `${Math.round(v)} days`);
export const fmtMonth = d3.utcFormat("%b %Y");
export const fmtDate = d3.utcFormat("%-d %b %Y");

// "€4.82M" -> "€4" + dimmed ".82M"
export function splitNumber(s) {
  const i = s.indexOf(".");
  if (i >= 0) return `${s.slice(0, i)}<span class="dim">${s.slice(i)}</span>`;
  const m = s.match(/^(.*\d)(\D+)$/);
  return m ? `${m[1]}<span class="dim">${m[2]}</span>` : s;
}

export const sum = (rows, f) => d3.sum(rows, f);
export const safeDiv = (a, b) => (b ? a / b : null);

// A chart rests in its final state; just before it scrolls in, it resets to its baseline and plays once.
export function reveal(el, comp) {
  const r = el.getBoundingClientRect();
  if (r.top < innerHeight && r.bottom > 0) return comp.play();
  let armed = false, done = false;
  const pre = new IntersectionObserver((es) => {
    if (!done && !armed && es[0].isIntersecting) { comp.reset(); armed = true; }
  }, {rootMargin: "0px 0px 25% 0px"});
  const go = new IntersectionObserver((es) => {
    if (!done && armed && es[0].isIntersecting) { comp.play(); done = true; pre.disconnect(); go.disconnect(); }
  }, {threshold: 0.2});
  pre.observe(el);
  go.observe(el);
}

export function tooltip(container) {
  const tip = document.createElement("div");
  tip.className = "tip";
  tip.style.opacity = 0;
  container.append(tip);
  let timer;
  return {
    show(html, x, y, bounds) {
      tip.innerHTML = html;
      const tw = tip.offsetWidth, th = tip.offsetHeight;
      let left = x + 16, top = y - th / 2;
      if (left + tw > bounds.width) left = x - tw - 16;
      tip.style.left = `${Math.max(0, left)}px`;
      tip.style.top = `${Math.max(0, Math.min(bounds.height - th, top))}px`;
      clearTimeout(timer);
      timer = setTimeout(() => (tip.style.opacity = 1), dur(60));
    },
    hide() { clearTimeout(timer); tip.style.opacity = 0; }
  };
}

export function svgIn(el, height) {
  const width = el.clientWidth;
  const svg = d3.select(el).append("svg").attr("width", width).attr("height", height).attr("viewBox", `0 0 ${width} ${height}`);
  return {svg, width, height};
}

export const DEFINITIONS = {
  pipeline: "Amount of opportunities by their created month, in EUR at the ECB rate on the created date, credited to the source campaign.",
  won: "Amount of won opportunities by their close month, in EUR at the ECB rate on the close date.",
  ratio: "Pipeline created divided by campaign cost, for campaigns with a recorded cost. Cost is spread evenly over each campaign's run days.",
  open: "Amount of opportunities that are not closed at the end of the day measured, in EUR.",
  funnel: "Cohort view: people who joined a campaign in the period, and every stage they ever reached. Conversion = people reaching the later stage / people reaching the earlier one.",
  cpl: "Campaign cost divided by the number of leads, MQLs or opportunities.",
  attribution: "First touch credits the source campaign. Last touch credits the latest touchpoint before the deal was created. Linear splits the amount evenly across every touchpoint.",
  influenced: "Full amount of every opportunity with at least one touchpoint from the campaign. Double-counts by design, so it is never summed across campaigns.",
  touches: "Touchpoints of every contact on the opportunity, dated on or before the day it was created.",
  velocity: "Median days between the two stages, by the month the later stage was reached.",
  stage: "Days between consecutive stage changes of the same opportunity.",
  stalled: "Open opportunity with no stage change in the last 30 days.",
  regression: "A stage change to a stage earlier in the sales process than the previous one."
};
export const info = (key, label) => `<button class="info" type="button" aria-label="Definition of ${label}: ${DEFINITIONS[key]}" data-def="${DEFINITIONS[key]}">i</button>`;
