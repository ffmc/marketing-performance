import {d3, dur, EASE, eur, int, svgIn} from "./core.js";
import {health} from "./model.js";

export function OpenByStage(el, m, getState) {
  el.innerHTML = `
    <div class="legend"><span><i style="background:var(--color-accent)"></i>Moving</span><span><i style="background:var(--color-warning)"></i>Stalled 30+ days</span></div>
    <div class="chart-wrap"></div>`;
  const wrap = el.querySelector(".chart-wrap");
  const H = 340, M = {t: 28, r: 12, b: 56, l: 56};
  const {svg, width: W} = svgIn(wrap, H);
  svg.attr("role", "img").attr("aria-label", "Open pipeline by stage, split into moving and stalled deals");
  const x = d3.scaleBand().domain(d3.range(4)).range([M.l, W - M.r]).paddingInner(0.3).paddingOuter(0.16);
  const x1 = d3.scaleBand().domain(["moving", "stalled"]).range([0, x.bandwidth()]).paddingInner(0.12);
  const y = d3.scaleLinear().range([H - M.b, M.t]);
  const gridG = svg.append("g"), yAxis = svg.append("g").attr("class", "axis");
  const cols = svg.selectAll("g.col").data(d3.range(4)).join("g").attr("class", "col").attr("transform", (i) => `translate(${x(i)},0)`);
  cols.append("rect").attr("class", "bar open-bar").attr("rx", 4).attr("x", x1("moving")).attr("width", x1.bandwidth());
  cols.append("rect").attr("class", "bar stalled-bar").attr("rx", 4).attr("x", x1("stalled")).attr("width", x1.bandwidth());
  cols.append("text").attr("class", "row-value v-moving").attr("text-anchor", "middle").attr("x", x1("moving") + x1.bandwidth() / 2);
  cols.append("text").attr("class", "row-delta warn v-stalled").attr("text-anchor", "middle").attr("x", x1("stalled") + x1.bandwidth() / 2);
  const xAxis = svg.append("g").attr("class", "axis");
  xAxis.append("line").attr("class", "axis-line").attr("x1", M.l).attr("x2", W - M.r).attr("y1", H - M.b).attr("y2", H - M.b);
  svg.append("line").attr("class", "axis-line").attr("x1", M.l).attr("x2", M.l).attr("y1", M.t - 8).attr("y2", H - M.b);
  const xLabels = xAxis.selectAll("text.row-label").data(d3.range(4)).join("text").attr("class", "row-label").attr("text-anchor", "middle")
    .attr("x", (i) => x(i) + x.bandwidth() / 2).attr("y", H - M.b + 22);
  const xSub = xAxis.selectAll("text.row-sub").data(d3.range(4)).join("text").attr("class", "row-sub").attr("text-anchor", "middle")
    .attr("x", (i) => x(i) + x.bandwidth() / 2).attr("y", H - M.b + 40);
  xAxis.selectAll("line.tick-mark").data(d3.range(4)).join("line").attr("class", "tick-mark")
    .attr("x1", (i) => x(i) + x.bandwidth() / 2).attr("x2", (i) => x(i) + x.bandwidth() / 2).attr("y1", H - M.b).attr("y2", H - M.b + 5);

  function draw(mode) {
    const s = getState();
    const h = health(m, s, s.range);
    y.domain([0, d3.max(h.byStage, (d) => Math.max(d.amount - d.stalledAmount, d.stalledAmount)) || 1]).nice(4);
    const T = mode === "play" ? dur(600) : dur(520), base = y(0);
    const ticks = y.ticks(4);
    gridG.selectAll("line").data(ticks, (d) => d).join("line").attr("class", "gridline").attr("x1", M.l).attr("x2", W - M.r).transition().duration(T).attr("y1", y).attr("y2", y);
    yAxis.selectAll("text").data(ticks, (d) => d).join("text").attr("x", M.l - 10).attr("dy", ".32em").attr("text-anchor", "end").text(eur).transition().duration(T).attr("y", y);
    yAxis.selectAll("line").data(ticks, (d) => d).join("line").attr("class", "tick-mark").attr("x1", M.l - 5).attr("x2", M.l).transition().duration(T).attr("y1", y).attr("y2", y);
    xLabels.text((i) => h.byStage[i].stage);
    xSub.text((i) => `${int(h.byStage[i].count)} deals · ${int(h.byStage[i].stalled)} stalled`);

    cols.each(function (i) {
      const g = d3.select(this), d = h.byStage[i];
      const vals = {moving: d.amount - d.stalledAmount, stalled: d.stalledAmount};
      for (const k of ["moving", "stalled"]) {
        const bar = g.select(k === "moving" ? ".open-bar" : ".stalled-bar");
        (mode === "play" ? bar.attr("y", base).attr("height", 0).transition().delay(dur(i * 80 + (k === "stalled" ? 60 : 0))).duration(T) : bar.transition().duration(T)).ease(EASE)
          .attr("y", y(vals[k])).attr("height", Math.max(0, base - y(vals[k])));
      }
      g.select(".v-moving").text(eur(vals.moving)).transition().duration(T).ease(EASE).attr("y", y(vals.moving) - 8);
      g.select(".v-stalled").text(d.stalled ? eur(vals.stalled) : "none").transition().duration(T).ease(EASE).attr("y", y(vals.stalled) - 8);
    });
  }
  draw("update");
  return {update: () => draw("update"), play: () => draw("play"), reset: () => cols.selectAll(".bar").interrupt().attr("y", y(0)).attr("height", 0)};
}
