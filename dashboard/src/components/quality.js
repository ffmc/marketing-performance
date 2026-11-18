import {d3, CHANNELS, chVar, chTextVar, dur, EASE, eur, pct, int, svgIn, tooltip} from "./core.js";
import {quality} from "./model.js";

const METRICS = [
  {k: "winRate", l: "Win rate", f: (v) => pct(v, 0)},
  {k: "avgDeal", l: "Average won deal", f: eur},
  {k: "wonPerEur", l: "Won per € spent", f: (v) => `€${v.toFixed(1)}`}
];

// One row per channel, three bar panels side by side so a channel can be read across.
export function Quality(el, m, getState) {
  el.innerHTML = `<div class="chart-wrap"></div>`;
  const wrap = el.querySelector(".chart-wrap");
  const compact = wrap.clientWidth < 560;
  const RH = 40, M = {t: 30, r: 8, b: 10, l: compact ? 86 : 104}, gap = compact ? 14 : 28;
  const {svg, width: W} = svgIn(wrap, M.t + M.b + RH * CHANNELS.length);
  svg.attr("role", "img").attr("aria-label", "Win rate, average won deal and won revenue per euro spent, by channel");
  const PW = (W - M.l - M.r - gap * 2) / 3;
  const tip = tooltip(wrap);
  const yBase = M.t + RH * CHANNELS.length;

  svg.selectAll("text.ch").data(CHANNELS).join("text").attr("class", "row-label ch").attr("x", 0)
    .attr("y", (c, i) => M.t + i * RH + RH / 2).attr("dy", ".32em").style("fill", chTextVar).text((c) => c);
  const panels = svg.selectAll("g.qpanel").data(METRICS).join("g").attr("class", "qpanel").attr("transform", (d, i) => `translate(${M.l + i * (PW + gap)},0)`);
  panels.append("text").attr("class", "qtitle").attr("y", 14).text((d) => d.l);
  panels.append("line").attr("class", "axis-line").attr("x1", 0).attr("x2", 0).attr("y1", M.t - 4).attr("y2", yBase);
  const rows = panels.selectAll("g.qrow").data((d) => CHANNELS.map((c) => ({metric: d, channel: c}))).join("g").attr("class", "qrow")
    .attr("transform", (d, i) => `translate(0,${M.t + i * RH})`);
  rows.append("rect").attr("class", "bar qbar").attr("y", RH / 2 - 9).attr("height", 18).attr("rx", 4).attr("width", 0).style("fill", (d) => chVar(d.channel));
  rows.append("text").attr("class", "row-value").attr("y", RH / 2).attr("dy", ".32em");

  function draw(mode) {
    const s = getState();
    const q = quality(m, s, s.range);
    const by = new Map(q.rows.map((r) => [r.channel, r]));
    const on = (c) => !s.channels.size || s.channels.has(c);
    const scales = new Map(METRICS.map((mt) => [mt.k, d3.scaleLinear().domain([0, d3.max(q.rows, (r) => r[mt.k]) || 1]).range([0, PW - 64])]));
    rows.each(function (d, i) {
      const g = d3.select(this), r = by.get(d.channel), v = r[d.metric.k], w = v == null ? 0 : Math.max(3, scales.get(d.metric.k)(v));
      const bar = g.select(".qbar").style("fill", on(d.channel) ? chVar(d.channel) : "var(--color-mark-muted)");
      (mode === "play" ? bar.attr("width", 0).transition().delay(dur((i % CHANNELS.length) * 50)).duration(dur(600)) : bar.transition().duration(dur(520))).ease(EASE).attr("width", w);
      g.select(".row-value").text(v == null ? "too few" : d.metric.f(v)).classed("dim-value", v == null)
        .transition().duration(mode === "play" ? 0 : dur(520)).ease(EASE).attr("x", w + 8);
    });
    rows.on("pointerenter", (e, d) => {
      const r = by.get(d.channel), [px, py] = d3.pointer(e, svg.node());
      tip.show(`<h4>${d.channel}</h4><dl><dt>Opportunities created</dt><dd>${int(r.created)}</dd><dt>Closed</dt><dd>${int(r.closed)}</dd><dt>Won</dt><dd>${int(r.won)}</dd>
        <dt>Win rate</dt><dd>${r.winRate == null ? "–" : pct(r.winRate, 0)}</dd><dt>Average won deal</dt><dd>${eur(r.avgDeal)}</dd><dt>Won per € spent</dt><dd>${r.wonPerEur == null ? "–" : `€${r.wonPerEur.toFixed(1)}`}</dd></dl>`, px, py, {width: W, height: M.t + M.b + RH * CHANNELS.length});
    }).on("pointerleave", () => tip.hide());
  }
  draw("update");
  return {update: () => draw("update"), play: () => draw("play"), reset: () => rows.select(".qbar").interrupt().attr("width", 0)};
}
