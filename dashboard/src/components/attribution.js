import {d3, CHANNELS, chVar, chTextVar, chName, dur, EASE, eur, int, svgIn, tooltip, fmtMonth} from "./core.js";
import {attributionByChannel, influencedByCampaign, touches} from "./model.js";

const fmtShort = d3.utcFormat("%b %y");

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

// Sourced (first touch) vs influenced pipeline for the campaigns with the most influence.
export function Influence(el, m, getState) {
  el.innerHTML = `<div class="legend"><span><i style="background:var(--color-text-primary)"></i>Sourced</span><span><i class="ring"></i>Influenced (not additive)</span></div><div class="chart-wrap"></div>`;
  const wrap = el.querySelector(".chart-wrap");
  const N = 10, RH = 34, M = {t: 6, r: 60, b: 24, l: Math.min(240, wrap.clientWidth * 0.42)};
  const {svg, width: W, height: H} = svgIn(wrap, M.t + M.b + RH * N);
  svg.attr("role", "img").attr("aria-label", "Sourced and influenced pipeline for the most influential campaigns");
  const x = d3.scaleLinear().range([M.l, W - M.r]);
  const axis = svg.append("g").attr("class", "axis");
  const g = svg.append("g");
  const tip = tooltip(wrap);

  function draw(mode) {
    const s = getState();
    const data = influencedByCampaign(m, s, s.range).sort((a, b) => b.influenced - a.influenced).slice(0, N);
    x.domain([0, d3.max(data, (d) => d.influenced) || 1]).nice();
    axis.selectAll("text").data(x.ticks(W < 500 ? 2 : 4), (d) => d).join("text").attr("y", H - 6).attr("text-anchor", "middle").text(eur).attr("x", x);
    const T = mode === "play" ? 0 : dur(520);
    const row = g.selectAll("g.drow").data(data, (d) => d.id).join((en) => {
      const r = en.append("g").attr("class", "drow").attr("transform", (d, i) => `translate(0,${M.t + i * RH})`).style("opacity", 0);
      r.append("text").attr("class", "drow-label").attr("y", RH / 2).attr("dy", ".32em");
      r.append("line").attr("class", "dumbbell").attr("y1", RH / 2).attr("y2", RH / 2);
      r.append("circle").attr("class", "src").attr("cy", RH / 2).attr("r", 5);
      r.append("circle").attr("class", "inf").attr("cy", RH / 2).attr("r", 5);
      return r;
    }, (up) => up, (ex) => ex.transition().duration(dur(200)).style("opacity", 0).remove());
    row.transition().duration(T).ease(EASE).attr("transform", (d, i) => `translate(0,${M.t + i * RH})`).style("opacity", 1);
    row.select(".drow-label").html((d) => `<tspan style="fill:${chTextVar(d.channel)}">●</tspan> ${d.topic.length > 26 ? d.topic.slice(0, 25) + "…" : d.topic} <tspan class="dim">${d.country} · ${fmtShort(d.start_on)}</tspan>`);
    const start = (sel) => (mode === "play" ? sel.attr("cx", M.l).attr("x1", M.l).attr("x2", M.l).transition().duration(dur(700)).ease(EASE) : sel.transition().duration(T).ease(EASE));
    start(row.select(".dumbbell")).attr("x1", (d) => x(d.sourced)).attr("x2", (d) => x(d.influenced));
    start(row.select(".src")).attr("cx", (d) => x(d.sourced));
    start(row.select(".inf")).attr("cx", (d) => x(d.influenced)).style("stroke", (d) => chVar(d.channel));
    row.on("pointerenter", (e, d) => {
      const [px, py] = d3.pointer(e, svg.node());
      tip.show(`<h4>${d.topic}</h4><div class="meta">${chName(d.channel)} · ${d.country} · launched ${fmtMonth(d.start_on)}</div><dl><dt>Sourced</dt><dd>${eur(d.sourced)}</dd><dt>Influenced</dt><dd>${eur(d.influenced)}</dd><dt>Influenced ÷ sourced</dt><dd>${d.sourced ? (d.influenced / d.sourced).toFixed(1) + "×" : "only assists"}</dd></dl>`, px, py, {width: W, height: H});
    }).on("pointerleave", () => tip.hide());
  }
  draw("update");
  return {update: () => draw("update"), play: () => draw("play"), reset() {}};
}

export function Touches(el, m, getState) {
  el.innerHTML = `<div class="chart-wrap"></div><p class="footnote touch-note"></p>`;
  const wrap = el.querySelector(".chart-wrap");
  const {svg, width: W, height: H} = svgIn(wrap, 200);
  svg.attr("role", "img").attr("aria-label", "Opportunities by number of touchpoints before creation");
  const M = {t: 22, r: 8, b: 26, l: 8};
  const x = d3.scaleBand().domain(d3.range(7)).range([M.l, W - M.r]).padding(0.18);
  const y = d3.scaleLinear().range([H - M.b, M.t]);
  const bars = svg.selectAll("rect").data(d3.range(7)).join("rect").attr("class", "bar touch-bar").attr("x", x).attr("width", x.bandwidth()).attr("rx", 4).attr("y", H - M.b).attr("height", 0);
  const vals = svg.selectAll("text.tv").data(d3.range(7)).join("text").attr("class", "row-value tv").attr("text-anchor", "middle").attr("x", (i) => x(i) + x.bandwidth() / 2);
  svg.append("g").attr("class", "axis").selectAll("text").data(d3.range(7)).join("text").attr("x", (i) => x(i) + x.bandwidth() / 2).attr("y", H - 8).attr("text-anchor", "middle").text((i) => (i === 6 ? "6+" : i));

  function draw(mode) {
    const s = getState();
    const t = touches(m, s, s.range);
    y.domain([0, d3.max(t.bins, (b) => b.count) || 1]);
    const tr = (sel, i) => (mode === "play" ? sel.attr("y", H - M.b).attr("height", 0).transition().delay(dur(i * 60)).duration(dur(600)) : sel.transition().duration(dur(520))).ease(EASE);
    bars.each(function (i) { tr(d3.select(this), i).attr("y", y(t.bins[i].count)).attr("height", H - M.b - y(t.bins[i].count)); });
    vals.text((i) => (t.bins[i].count ? int(t.bins[i].count) : "")).transition().duration(mode === "play" ? 0 : dur(520)).attr("y", (i) => y(t.bins[i].count) - 6);
    el.querySelector(".touch-note").textContent = `${int(t.total)} opportunities created in the period, by touchpoints before creation. Median: ${t.median ?? "–"}. Zero means no tracked touch; the deal falls back to its campaign field.`;
  }
  draw("update");
  return {update: () => draw("update"), play: () => draw("play"), reset: () => bars.interrupt().attr("height", 0).attr("y", H - M.b)};
}
