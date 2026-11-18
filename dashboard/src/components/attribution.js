import {d3, CHANNELS, chVar, chTextVar, dur, EASE, eur, svgIn} from "./core.js";
import {attributionByChannel} from "./model.js";

export const MODELS = [["first_touch", "First touch"], ["last_touch", "Last touch"], ["linear", "Linear"]];

export function Attribution(el, m, getState, setState) {
  el.innerHTML = `
    <div class="attr-head"><div class="seg" role="radiogroup" aria-label="Attribution model">${MODELS.map(([k, l]) => `<button type="button" role="radio" data-m="${k}">${l}</button>`).join("")}</div>
    <div class="legend"><span><svg width="14" height="14" aria-hidden="true"><line x1="7" x2="7" y1="0" y2="14" class="ghost"/></svg>First touch</span></div></div>
    <div class="chart-wrap"></div><p class="footnote attr-note"></p>`;
  el.querySelectorAll("[data-m]").forEach((b) => b.addEventListener("click", () => setState({model: b.dataset.m})));
  const wrap = el.querySelector(".chart-wrap");
  const keys = [...CHANNELS, "Unattributed"];
  const RH = 46, M = {t: 8, r: 112, b: 8, l: wrap.clientWidth < 420 ? 92 : 108};
  const {svg, width: W} = svgIn(wrap, M.t + M.b + RH * keys.length);
  svg.attr("role", "img").attr("aria-label", "Pipeline by channel under the selected attribution model");
  const rowsG = svg.append("g").attr("class", "rows");
  svg.append("line").attr("class", "axis-line").attr("x1", M.l).attr("x2", M.l).attr("y1", M.t).attr("y2", M.t + RH * keys.length);
  const rows = rowsG.selectAll("g").data(keys, (d) => d).join((enter) => {
    const g = enter.append("g").attr("class", "row");
    g.append("rect").attr("class", "hit").attr("width", W).attr("height", RH).attr("fill", "transparent");
    g.append("text").attr("class", "row-label").attr("y", RH / 2).attr("dy", ".32em").text((d) => d).style("fill", chTextVar);
    g.append("rect").attr("class", "bar").attr("x", M.l).attr("y", RH / 2 - 9).attr("height", 18).attr("rx", 4).attr("width", 0);
    g.append("line").attr("class", "ghost").attr("y1", RH / 2 - 14).attr("y2", RH / 2 + 14);
    g.append("text").attr("class", "row-value").attr("y", RH / 2 - 7).attr("dy", ".32em");
    g.append("text").attr("class", "row-delta").attr("y", RH / 2 + 9).attr("dy", ".32em");
    return g;
  });
  rows.on("pointerenter", function () { rowsG.classed("hovering", true); d3.select(this).classed("is-hover", true); })
    .on("pointerleave", function () { rowsG.classed("hovering", false); d3.select(this).classed("is-hover", false); });
  const prevVal = new Map();

  function draw(mode) {
    const s = getState();
    const a = attributionByChannel(m, s, s.range);
    const vals = a[s.model];
    const max = d3.max(MODELS, ([k]) => d3.max(a[k].values())) || 1;
    const x = d3.scaleLinear().domain([0, max]).range([0, W - M.l - M.r]);
    const order = [...keys].sort((p, q) => vals.get(q) - vals.get(p));
    el.querySelectorAll("[data-m]").forEach((b) => b.setAttribute("aria-checked", b.dataset.m === s.model));
    const on = (k) => k !== "Unattributed" && (!s.channels.size || s.channels.has(k));
    rows.interrupt().transition().duration(mode === "play" ? 0 : dur(560)).ease(d3.easeCubicInOut)
      .attr("transform", (k) => `translate(0,${M.t + order.indexOf(k) * RH})`);
    rows.select(".bar").style("fill", (k) => (on(k) ? chVar(k) : "var(--color-mark-muted)"));
    rows.select(".row-label").style("opacity", (k) => (on(k) || (!s.channels.size && k === "Unattributed") ? 1 : 0.55));
    rows.each(function (k, i) {
      const g = d3.select(this), v = vals.get(k), f = a.first_touch.get(k);
      const w = Math.max(v > 0 ? 4 : 0, x(v));
      const bar = g.select(".bar");
      if (mode === "play") bar.interrupt().attr("width", 0).transition().delay(dur(i * 70)).duration(dur(700)).ease(EASE).attr("width", w);
      else bar.interrupt().transition().duration(dur(560)).ease(EASE).attr("width", w);
      g.select(".ghost").attr("x1", M.l + x(f)).attr("x2", M.l + x(f)).style("opacity", s.model === "first_touch" ? 0 : 0.8);
      const from = mode === "play" ? 0 : prevVal.get(k) ?? v;
      prevVal.set(k, v);
      const vt = g.select(".row-value");
      if (mode === "play") vt.attr("x", M.l + 10);
      vt.interrupt().transition().delay(mode === "play" ? dur(i * 70) : 0).duration(dur(mode === "play" ? 700 : 560)).ease(EASE)
        .attr("x", M.l + w + 10).textTween(() => { const ip = d3.interpolateNumber(from, v); return (t) => eur(ip(t)); });
      const ch = f ? v / f - 1 : 0;
      g.select(".row-delta")
        .attr("class", `row-delta ${s.model === "first_touch" || Math.abs(ch) < 0.005 ? "zero" : ch > 0 ? "pos" : "neg"}`)
        .text(s.model === "first_touch" ? "sourced" : `${ch >= 0 ? "+" : "−"}${Math.abs(ch * 100).toFixed(0)}% vs first`)
        .transition().duration(mode === "play" ? 0 : dur(560)).ease(EASE).attr("x", M.l + w + 10);
    });
    el.querySelector(".attr-note").textContent = `Every model splits the same ${eur(a.total)}, so the bars always add up to company pipeline for the period.`;
  }
  draw("update");
  return {update: () => draw("update"), play: () => draw("play"), reset: () => rows.select(".bar").interrupt().attr("width", 0)};
}
