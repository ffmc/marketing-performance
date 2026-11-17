import {d3, dur, EASE, days, int, svgIn} from "./core.js";
import {velocity, timeInStage} from "./model.js";

// One strip of dots per stage pair, jittered vertically, with the median marked. The x axis stops at the 95th percentile.
export function Velocity(el, m, getState) {
  el.innerHTML = `<div class="chart-wrap"></div><p class="footnote vel-note"></p>`;
  const wrap = el.querySelector(".chart-wrap");
  const RH = 78, M = {t: 8, r: 20, b: 26, l: 12};
  const {svg, width: W, height: H} = svgIn(wrap, M.t + M.b + RH * 3);
  svg.attr("role", "img").attr("aria-label", "Days between funnel stages");
  const x = d3.scaleLinear().range([M.l, W - M.r]);
  const gridG = svg.append("g"), axis = svg.append("g").attr("class", "axis");
  const strips = svg.selectAll("g.strip").data(d3.range(3)).join("g").attr("class", "strip").attr("transform", (i) => `translate(0,${M.t + i * RH})`);
  strips.append("text").attr("class", "row-label").attr("x", M.l).attr("y", 14);
  strips.append("g").attr("class", "pts");
  strips.append("line").attr("class", "median-line").attr("y1", 24).attr("y2", RH - 8);
  strips.append("text").attr("class", "median-label").attr("y", 14).attr("text-anchor", "end");
  const MAX_DOTS = 700;

  function draw(mode) {
    const s = getState();
    const v = velocity(m, s, s.range);
    const p95 = d3.max(v, (d) => d3.quantile(d.values, 0.95) ?? 0) || 30;
    x.domain([0, p95]).nice();
    const ticks = x.ticks(W < 500 ? 4 : 8);
    gridG.selectAll("line").data(ticks, (d) => d).join("line").attr("class", "gridline vgrid").attr("y1", M.t).attr("y2", H - M.b).attr("x1", x).attr("x2", x);
    axis.selectAll("text").data(ticks, (d) => d).join("text").attr("y", H - 8).attr("text-anchor", "middle").attr("x", x).text((d) => `${d}d`);
    strips.each(function (i) {
      const g = d3.select(this), d = v[i];
      g.select(".row-label").text(`${d.label} · ${int(d.values.length)}`);
      const step = Math.max(1, Math.ceil(d.values.length / MAX_DOTS));
      const pts = d.values.filter((_, j) => j % step === 0).map((val, j) => ({val: Math.min(val, x.domain()[1]), jit: ((j * 7919) % 97) / 97}));
      const c = g.select(".pts").selectAll("circle").data(pts).join("circle").attr("class", "vdot").attr("r", 2.5)
        .attr("cy", (p) => 28 + p.jit * (RH - 40));
      if (mode === "play") c.attr("cx", M.l).style("opacity", 0).transition().delay((p, j) => dur((j / pts.length) * 400)).duration(dur(500)).ease(EASE).attr("cx", (p) => x(p.val)).style("opacity", 0.55);
      else c.interrupt().style("opacity", 0.55).transition().duration(dur(520)).ease(EASE).attr("cx", (p) => x(p.val));
      const mx = d.median == null ? M.l : x(Math.min(d.median, x.domain()[1]));
      g.select(".median-line").transition().duration(dur(520)).ease(EASE).attr("x1", mx).attr("x2", mx);
      g.select(".median-label").text(d.median == null ? "no data" : `median ${days(d.median)}`).transition().duration(dur(520)).ease(EASE).attr("x", W - M.r);
    });
    el.querySelector(".vel-note").textContent = `Each dot is one person or deal whose later stage fell in the period${v.some((d) => d.values.length > MAX_DOTS) ? " (a sample is drawn when there are many)" : ""}. Values past the axis sit at its edge.`;
  }
  draw("update");
  return {update: () => draw("update"), play: () => draw("play"), reset: () => strips.selectAll(".vdot").interrupt().style("opacity", 0)};
}

export function StageTime(el, m, getState) {
  el.innerHTML = `<div class="chart-wrap"></div>`;
  const wrap = el.querySelector(".chart-wrap");
  const RH = 40, M = {t: 4, r: 80, b: 4, l: 104};
  const {svg, width: W} = svgIn(wrap, M.t + M.b + RH * 4);
  svg.attr("role", "img").attr("aria-label", "Median days in each sales stage");
  const rows = svg.selectAll("g").data(d3.range(4)).join("g").attr("transform", (i) => `translate(0,${M.t + i * RH})`);
  rows.append("text").attr("class", "row-label").attr("y", RH / 2).attr("dy", ".32em");
  rows.append("rect").attr("class", "bar stage-bar").attr("x", M.l).attr("y", RH / 2 - 8).attr("height", 16).attr("rx", 4).attr("width", 0);
  rows.append("text").attr("class", "row-value").attr("y", RH / 2).attr("dy", ".32em");

  function draw(mode) {
    const s = getState();
    const t = timeInStage(m, s, s.range);
    const x = d3.scaleLinear().domain([0, d3.max(t, (d) => d.median) || 1]).range([0, W - M.l - M.r]);
    rows.each(function (i) {
      const g = d3.select(this), d = t[i], w = d.median == null ? 0 : Math.max(4, x(d.median));
      g.select(".row-label").text(d.stage);
      const bar = g.select(".stage-bar");
      (mode === "play" ? bar.attr("width", 0).transition().delay(dur(i * 70)).duration(dur(600)) : bar.transition().duration(dur(520))).ease(EASE).attr("width", w);
      g.select(".row-value").text(d.median == null ? "–" : days(d.median)).transition().duration(mode === "play" ? 0 : dur(520)).ease(EASE).attr("x", M.l + w + 10);
    });
  }
  draw("update");
  return {update: () => draw("update"), play: () => draw("play"), reset: () => rows.select(".stage-bar").interrupt().attr("width", 0)};
}
