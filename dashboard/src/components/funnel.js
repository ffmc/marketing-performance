import {d3, dur, EASE, int, pct, svgIn} from "./core.js";
import {funnel} from "./model.js";

// Bar length is the step's conversion from the stage before it; the dashed tick is the same rate for all channels.
export function Funnel(el, m, getState) {
  el.innerHTML = `<div class="legend"><span><i style="background:var(--color-accent)"></i>Selection</span><span><svg width="14" height="14" aria-hidden="true"><line x1="7" x2="7" y1="0" y2="14" class="ghost"/></svg>All channels</span></div><div class="chart-wrap"></div>`;
  const wrap = el.querySelector(".chart-wrap");
  const RH = 52, M = {t: 4, r: 16, b: 4, l: wrap.clientWidth < 460 ? 108 : 132};
  const {svg, width: W} = svgIn(wrap, M.t + M.b + RH * 6);
  svg.attr("role", "img").attr("aria-label", "Funnel conversion by stage");
  const x = d3.scaleLinear().domain([0, 1]).range([M.l, W - M.r]);
  const rows = svg.selectAll("g").data(d3.range(6)).join("g").attr("transform", (i) => `translate(0,${M.t + i * RH})`);
  rows.append("text").attr("class", "row-label").attr("x", 0).attr("y", 18);
  rows.append("text").attr("class", "row-sub").attr("x", 0).attr("y", 36);
  rows.append("rect").attr("class", "track").attr("x", M.l).attr("y", 14).attr("height", 14).attr("rx", 4).attr("width", W - M.l - M.r);
  rows.append("rect").attr("class", "bar funnel-bar").attr("x", M.l).attr("y", 14).attr("height", 14).attr("rx", 4).attr("width", 0);
  rows.append("line").attr("class", "ghost").attr("y1", 9).attr("y2", 33);
  rows.append("text").attr("class", "row-value").attr("y", 44).attr("x", M.l);

  function draw(mode) {
    const s = getState();
    const sel = funnel(m, s, s.range), all = funnel(m, s, s.range, true);
    const compare = s.channels.size > 0;
    rows.each(function (i) {
      const g = d3.select(this), d = sel[i], a = all[i];
      g.select(".row-label").text(d.label);
      g.select(".row-sub").attr("class", "row-sub num").text(int(d.n));
      const rate = i === 0 ? 1 : d.rate ?? 0;
      const bar = g.select(".funnel-bar");
      const w = Math.max(0, x(rate) - M.l);
      if (mode === "play") bar.interrupt().attr("width", 0).transition().delay(dur(i * 80)).duration(dur(700)).ease(EASE).attr("width", w);
      else bar.interrupt().transition().duration(dur(520)).ease(EASE).attr("width", w);
      const ar = i === 0 ? 1 : a.rate ?? 0;
      g.select(".ghost").style("opacity", compare && i > 0 ? 0.8 : 0).transition().duration(dur(520)).ease(EASE).attr("x1", x(ar)).attr("x2", x(ar));
      g.select(".row-value").text(i === 0 ? "Everyone who joined a campaign" : `${pct(d.rate)} of ${/^[A-Z]{2}/.test(sel[i - 1].label) ? sel[i - 1].label : sel[i - 1].label.toLowerCase()}${compare ? ` · all channels ${pct(a.rate)}` : ""}`);
    });
  }
  draw("update");
  return {update: () => draw("update"), play: () => draw("play"), reset: () => rows.select(".funnel-bar").interrupt().attr("width", 0)};
}
