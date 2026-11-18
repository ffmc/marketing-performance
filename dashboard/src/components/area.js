import {d3, DIMMED, CHANNELS, chVar, chName, dur, EASE, eur, fmtMonth, svgIn, tooltip} from "./core.js";
import {pipelineByChannelMonth, defaultRange} from "./model.js";

export function PipelineArea(el, m, getState, setState) {
  el.innerHTML = `
    <div class="legend">${CHANNELS.map((c) => `<span data-ch="${c}"><i style="background:${chVar(c)}"></i>${c}</span>`).join("")}<span><i style="background:var(--color-mark-muted)"></i>Unattributed</span></div>
    <div class="chart-wrap"></div>
    <div class="range-row"><span class="range-label"></span><button type="button" class="text-btn">Reset to last 12 months</button></div>`;
  const wrap = el.querySelector(".chart-wrap");
  const H = Math.round(Math.max(260, Math.min(380, wrap.clientWidth * 0.42)));
  const {svg, width: W} = svgIn(wrap, H);
  svg.attr("role", "img").attr("aria-label", "Monthly pipeline created by channel. Drag to choose the period.");
  const M = {t: 12, r: 12, b: 28, l: 56};
  const x = d3.scaleUtc().domain([m.firstMonth, m.lastMonth]).range([M.l, W - M.r]);
  const y = d3.scaleLinear().range([H - M.b, M.t]);
  const tip = tooltip(wrap);

  const clipId = `clip-${Math.random().toString(36).slice(2)}`;
  const clip = svg.append("clipPath").attr("id", clipId).append("rect").attr("x", 0).attr("y", 0).attr("height", H).attr("width", W);
  const gridG = svg.append("g");
  const yAxis = svg.append("g").attr("class", "axis");
  svg.append("g").attr("class", "axis").attr("transform", `translate(0,${H - M.b + 18})`)
    .selectAll("text").data(x.ticks(W < 560 ? d3.utcYear.every(1) : d3.utcMonth.every(6))).join("text")
    .attr("x", x).attr("text-anchor", "middle").text(d3.utcFormat(W < 560 ? "%Y" : "%b %Y"));
  svg.append("g").selectAll("line").data(x.ticks(W < 560 ? d3.utcYear.every(1) : d3.utcMonth.every(6))).join("line").attr("class", "tick-mark")
    .attr("x1", x).attr("x2", x).attr("y1", H - M.b).attr("y2", H - M.b + 5);
  const areasG = svg.append("g").attr("clip-path", `url(#${clipId})`);
  svg.append("line").attr("class", "axis-line").attr("x1", M.l).attr("x2", W - M.r).attr("y1", H - M.b).attr("y2", H - M.b);
  svg.append("line").attr("class", "axis-line").attr("x1", M.l).attr("x2", M.l).attr("y1", M.t).attr("y2", H - M.b);
  const cross = svg.append("line").attr("class", "crosshair").attr("y1", M.t).attr("y2", H - M.b).style("opacity", 0);
  const brushG = svg.append("g").attr("class", "brush");

  const area = d3.area().x((d) => x(d.data.month)).y0((d) => y(d[0])).y1((d) => y(d[1])).curve(d3.curveMonotoneX);
  const brush = d3.brushX().extent([[M.l, M.t], [W - M.r, H - M.b]]).on("end", (ev) => {
    if (!ev.sourceEvent) return;
    if (!ev.selection) return setState({range: defaultRange(m)});
    let [a, b] = ev.selection.map((px) => d3.utcMonth.round(x.invert(px)));
    if (b <= a) b = d3.utcMonth.offset(a, 1);
    setState({range: [a, b]});
  });
  brushG.call(brush);
  el.querySelector(".text-btn").addEventListener("click", () => setState({range: defaultRange(m)}));

  let data;
  function draw(animate) {
    const s = getState();
    data = pipelineByChannelMonth(m, s);
    const series = d3.stack().keys(data.keys)(data.rows);
    y.domain([0, d3.max(series.at(-1), (d) => d[1]) || 1]).nice();
    const T = animate ? dur(520) : 0;

    gridG.selectAll("line").data(y.ticks(4), (d) => d).join("line").attr("class", "gridline")
      .attr("x1", M.l).attr("x2", W - M.r).transition().duration(T).attr("y1", y).attr("y2", y);
    yAxis.selectAll("text").data(y.ticks(4), (d) => d).join("text").attr("x", M.l - 8).attr("dy", ".32em")
      .attr("text-anchor", "end").text(eur).transition().duration(T).attr("y", y);
    yAxis.selectAll("line").data(y.ticks(4), (d) => d).join("line").attr("class", "tick-mark").attr("x1", M.l - 5).attr("x2", M.l)
      .transition().duration(T).attr("y1", y).attr("y2", y);

    const sel = (k) => !s.channels.size || s.channels.has(k);
    areasG.selectAll("path").data(series, (d) => d.key).join("path")
      .attr("class", "area-band")
      .style("fill", (d) => (sel(d.key) ? chVar(d.key) : "var(--color-mark-muted)"))
      .style("opacity", (d) => (sel(d.key) || d.key === "Unattributed" ? 1 : DIMMED))
      .transition().duration(T).ease(EASE).attr("d", area);

    el.querySelectorAll(".legend [data-ch]").forEach((n) => (n.style.opacity = sel(n.dataset.ch) ? 1 : DIMMED));
    brushG.call(brush.move, [x(s.range[0]), x(s.range[1])]);
    el.querySelector(".range-label").textContent = `Selected: ${fmtMonth(s.range[0])} to ${fmtMonth(s.range[1])}`;
  }

  brushG.on("pointermove.tip", (ev) => {
    const [px] = d3.pointer(ev, svg.node());
    const mo = d3.utcMonth.round(x.invert(px));
    const row = data.rows.find((r) => +r.month === +mo);
    if (!row) return;
    cross.attr("x1", x(mo)).attr("x2", x(mo)).style("opacity", 1);
    const total = d3.sum(data.keys, (k) => row[k]);
    tip.show(`<h4>${fmtMonth(mo)}</h4><dl>${[...data.keys].reverse().filter((k) => row[k] > 0)
      .map((k) => `<dt>${k === "Unattributed" ? k : chName(k)}</dt><dd>${eur(row[k])}</dd>`).join("")}<dt><b>Total</b></dt><dd><b>${eur(total)}</b></dd></dl>`,
      x(mo), M.t + 40, {width: W, height: H});
  }).on("pointerleave.tip", () => { cross.style("opacity", 0); tip.hide(); });

  draw(false);
  return {
    update: () => draw(true),
    play: () => clip.interrupt().attr("width", 0).transition().duration(dur(900)).ease(EASE).attr("width", W),
    reset: () => clip.interrupt().attr("width", 0)
  };
}
