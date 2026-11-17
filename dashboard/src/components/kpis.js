import {d3, dur, EASE, eur, ratio, splitNumber, info} from "./core.js";
import {kpis, kpiSeries, priorRange} from "./model.js";

const DEFS = [
  {key: "pipeline", label: "Pipeline created", fmt: eur},
  {key: "won", label: "Won revenue", fmt: eur},
  {key: "ratio", label: "Pipeline to spend", fmt: ratio},
  {key: "open", label: "Open pipeline", fmt: eur}
];

export function KPIs(el, m, getState) {
  el.innerHTML = DEFS.map((d) => `
    <article class="kpi" data-k="${d.key}">
      <div class="kpi-head"><span>${d.label}</span>${info(d.key, d.label)}</div>
      <div class="kpi-value" aria-live="polite"></div>
      <div class="kpi-foot"><span class="delta"></span>
        <svg class="spark" viewBox="0 0 96 36" preserveAspectRatio="none" aria-hidden="true"><path class="area"/><path class="line"/><circle class="end" r="3.5"/></svg>
      </div>
    </article>`).join("");
  const prev = {}, lastLen = {};

  function draw(fromZero) {
    const s = getState();
    const cur = kpis(m, s, s.range), pri = kpis(m, s, priorRange(s.range));
    for (const d of DEFS) {
      const tile = el.querySelector(`[data-k="${d.key}"]`);
      const val = tile.querySelector(".kpi-value");
      const to = cur[d.key] ?? 0, from = fromZero ? 0 : prev[d.key] ?? to;
      prev[d.key] = to;
      d3.select(val).interrupt().transition().duration(dur(fromZero ? 900 : 520)).ease(EASE)
        .tween("text", () => { const i = d3.interpolateNumber(from, to); return (t) => { val.innerHTML = splitNumber(d.fmt(i(t))); }; });

      const change = pri[d.key] ? to / pri[d.key] - 1 : null;
      const delta = tile.querySelector(".delta");
      delta.className = `delta ${change == null ? "" : change >= 0 ? "up" : "down"}`;
      delta.innerHTML = change == null ? "No prior period"
        : `<svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M5 1.5L9 7.5H1z" fill="currentColor"/></svg><b>${change >= 0 ? "+" : "−"}${Math.abs(change * 100).toFixed(0)}%</b> vs prior period`;

      const series = kpiSeries(m, s, s.range, d.key);
      const x = d3.scaleLinear().domain([0, Math.max(1, series.length - 1)]).range([2, 92]);
      const y = d3.scaleLinear().domain([0, d3.max(series) || 1]).range([33, 4]);
      const line = d3.line().x((_, i) => x(i)).y((v) => y(v)).curve(d3.curveMonotoneX);
      const area = d3.area().x((_, i) => x(i)).y0(36).y1((v) => y(v)).curve(d3.curveMonotoneX);
      const svg = d3.select(tile).select(".spark");
      const lp = svg.select(".line"), ap = svg.select(".area"), end = svg.select(".end");
      const sameLen = lastLen[d.key] === series.length;
      if (fromZero) {
        lp.attr("d", line(series)); ap.attr("d", area(series));
        const L = lp.node().getTotalLength();
        lp.attr("stroke-dasharray", L).attr("stroke-dashoffset", L)
          .transition().delay(dur(200)).duration(dur(800)).ease(EASE).attr("stroke-dashoffset", 0)
          .on("end", () => lp.attr("stroke-dasharray", null));
        ap.attr("opacity", 0).transition().delay(dur(500)).duration(dur(500)).attr("opacity", 0.12);
        end.attr("cx", x(series.length - 1)).attr("cy", y(series.at(-1))).attr("r", 0)
          .transition().delay(dur(900)).duration(dur(180)).attr("r", 3.5);
      } else {
        (sameLen ? lp.transition().duration(dur(520)).ease(EASE) : lp).attr("d", line(series));
        (sameLen ? ap.transition().duration(dur(520)).ease(EASE) : ap).attr("d", area(series));
        end.transition().duration(dur(520)).ease(EASE).attr("cx", x(series.length - 1)).attr("cy", y(series.at(-1)));
      }
      lastLen[d.key] = series.length;
    }
  }

  draw(true);
  return {
    update: () => draw(false),
    play: () => draw(true),
    reset: () => DEFS.forEach((d) => (el.querySelector(`[data-k="${d.key}"] .kpi-value`).innerHTML = splitNumber(d.fmt(0))))
  };
}
