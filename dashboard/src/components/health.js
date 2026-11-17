import {d3, dur, EASE, eur, int, svgIn, tooltip} from "./core.js";
import {health, STAGES} from "./model.js";

export function OpenByStage(el, m, getState) {
  el.innerHTML = `<div class="chart-wrap"></div>`;
  const wrap = el.querySelector(".chart-wrap");
  const RH = 46, M = {t: 4, r: 150, b: 4, l: 104};
  const {svg, width: W} = svgIn(wrap, M.t + M.b + RH * 4);
  svg.attr("role", "img").attr("aria-label", "Open pipeline by stage");
  const rows = svg.selectAll("g").data(d3.range(4)).join("g").attr("transform", (i) => `translate(0,${M.t + i * RH})`);
  rows.append("text").attr("class", "row-label").attr("y", RH / 2).attr("dy", ".32em");
  rows.append("rect").attr("class", "bar open-bar").attr("x", M.l).attr("y", RH / 2 - 9).attr("height", 18).attr("rx", 4).attr("width", 0);
  rows.append("text").attr("class", "row-value").attr("y", RH / 2 - 7).attr("dy", ".32em");
  rows.append("text").attr("class", "row-delta").attr("y", RH / 2 + 9).attr("dy", ".32em");

  function draw(mode) {
    const s = getState();
    const h = health(m, s, s.range);
    const x = d3.scaleLinear().domain([0, d3.max(h.byStage, (d) => d.amount) || 1]).range([0, W - M.l - M.r]);
    rows.each(function (i) {
      const g = d3.select(this), d = h.byStage[i], w = d.amount ? Math.max(4, x(d.amount)) : 0;
      g.select(".row-label").text(d.stage);
      const bar = g.select(".open-bar");
      (mode === "play" ? bar.attr("width", 0).transition().delay(dur(i * 70)).duration(dur(600)) : bar.transition().duration(dur(520))).ease(EASE).attr("width", w);
      g.select(".row-value").text(`${eur(d.amount)} · ${int(d.count)} deals`).transition().duration(mode === "play" ? 0 : dur(520)).ease(EASE).attr("x", M.l + w + 10);
      g.select(".row-delta").attr("class", `row-delta ${d.stalled ? "warn" : "zero"}`).text(d.stalled ? `${d.stalled} stalled` : "none stalled")
        .transition().duration(mode === "play" ? 0 : dur(520)).ease(EASE).attr("x", M.l + w + 10);
    });
  }
  draw("update");
  return {update: () => draw("update"), play: () => draw("play"), reset: () => rows.select(".open-bar").interrupt().attr("width", 0)};
}

// Stages on one line; forward moves arc above, backward moves (regressions) arc below in the warning colour.
export function StageFlow(el, m, getState) {
  el.innerHTML = `<div class="legend"><span><i style="background:var(--color-mark-muted)"></i>Forward move</span><span><i style="background:var(--color-warning)"></i>Backward move (regression)</span></div><div class="chart-wrap"></div><p class="footnote flow-note"></p>`;
  const wrap = el.querySelector(".chart-wrap");
  const nodes = [...STAGES, "Closed Won", "Closed Lost"];
  const {svg, width: W, height: H} = svgIn(wrap, 260);
  svg.attr("role", "img").attr("aria-label", "Stage changes between sales stages");
  const midY = 130;
  const x = d3.scalePoint().domain(nodes).range([40, W - 40]);
  const arcsG = svg.append("g");
  const tip = tooltip(wrap);
  const nodeG = svg.append("g").selectAll("g").data(nodes).join("g").attr("transform", (d) => `translate(${x(d)},${midY})`);
  nodeG.append("circle").attr("r", 6).attr("class", "flow-node");
  nodeG.append("text").attr("class", "flow-label").attr("text-anchor", "middle").attr("y", (d, i) => (i % 2 ? 26 : -16))
    .text((d) => (W < 560 ? d.replace("Closed ", "") : d));

  const path = (t) => {
    const a = x(t.from), b = x(t.to), r = Math.abs(b - a) / 2, up = !t.regression;
    return `M${a},${midY} A${r},${Math.min(r * 0.8, 105)} 0 0 ${a < b === up ? 1 : 0} ${b},${midY}`;
  };

  function draw(mode) {
    const s = getState();
    const h = health(m, s, s.range);
    const t = h.transitions.filter((d) => nodes.includes(d.from) && nodes.includes(d.to));
    const w = d3.scaleSqrt().domain([0, d3.max(t, (d) => d.count) || 1]).range([1, 14]);
    const arcs = arcsG.selectAll("path").data(t, (d) => `${d.from}>${d.to}`).join(
      (en) => en.append("path").attr("class", (d) => `flow-arc ${d.regression ? "regression" : ""}`).attr("d", path).style("stroke-width", 0),
      (up) => up,
      (ex) => ex.transition().duration(dur(200)).style("stroke-width", 0).remove()
    );
    arcs.on("pointerenter", (e, d) => {
      const [px, py] = d3.pointer(e, svg.node());
      tip.show(`<h4>${d.from} → ${d.to}</h4><dl><dt>Stage changes</dt><dd>${int(d.count)}</dd><dt>Direction</dt><dd>${d.regression ? "backward" : "forward"}</dd></dl>`, px, py, {width: W, height: H});
    }).on("pointerleave", () => tip.hide());
    if (mode === "play") {
      arcs.each(function (d) {
        const p = d3.select(this), L = this.getTotalLength();
        p.style("stroke-width", w(d.count)).attr("stroke-dasharray", L).attr("stroke-dashoffset", L)
          .transition().duration(dur(800)).ease(EASE).attr("stroke-dashoffset", 0).on("end", () => p.attr("stroke-dasharray", null));
      });
      arcsG.selectAll(".regression").transition("pulse").delay(dur(900)).duration(dur(260)).style("opacity", 1).transition().duration(dur(260)).style("opacity", 0.85);
    } else arcs.transition().duration(dur(520)).ease(EASE).style("stroke-width", (d) => w(d.count));
    const back = d3.sum(t.filter((d) => d.regression), (d) => d.count);
    el.querySelector(".flow-note").textContent = `${int(d3.sum(t, (d) => d.count))} stage changes in the period, ${int(back)} of them backward. Line width shows the number of changes.`;
  }
  draw("update");
  return {update: () => draw("update"), play: () => draw("play"), reset() {}};
}
