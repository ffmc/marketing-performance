import {d3, CHANNELS, chVar, chName, dur, EASE, eur, ratio, svgIn, tooltip, fmtMonth} from "./core.js";

export const matchQuery = (c, q) => !q || c.topic.toLowerCase().includes(q) || c.channel.toLowerCase().includes(q) || (c.country ?? "").toLowerCase() === q;

export function Scatter(el, getCampaigns, getState) {
  el.innerHTML = `
    <div class="legend">${CHANNELS.map((c) => `<span data-ch="${c}"><i style="background:${chVar(c)}"></i>${c}</span>`).join("")}<span><i class="ring"></i>Size: won revenue</span></div>
    <div class="chart-wrap"></div>`;
  const note = el.closest("section").querySelector(".scatter-note");
  const wrap = el.querySelector(".chart-wrap");
  const H = Math.round(Math.max(300, Math.min(500, wrap.clientWidth * 0.62)));
  const {svg, width: W} = svgIn(wrap, H);
  svg.attr("role", "img").attr("aria-label", "Campaign cost against pipeline created");
  const M = {t: 16, r: 36, b: 40, l: 56};
  const x = d3.scaleLog().range([M.l, W - M.r]), y = d3.scaleLog().range([H - M.b, M.t]);
  const r = d3.scaleSqrt().range([4, W < 500 ? 11 : 15]);
  const tip = tooltip(wrap);
  const gridG = svg.append("g"), xAxis = svg.append("g").attr("class", "axis"), yAxis = svg.append("g").attr("class", "axis");
  const refs = svg.append("g");
  svg.append("line").attr("class", "axis-line").attr("x1", M.l).attr("x2", W - M.r).attr("y1", H - M.b).attr("y2", H - M.b);
  svg.append("line").attr("class", "axis-line").attr("x1", M.l).attr("x2", M.l).attr("y1", M.t).attr("y2", H - M.b);
  svg.append("text").attr("class", "axis-title").attr("x", W - M.r).attr("y", H - 4).attr("text-anchor", "end").text("Campaign cost →");
  svg.append("text").attr("class", "axis-title").attr("x", M.l).attr("y", M.t - 4).text("↑ Pipeline created");
  const dots = svg.append("g").attr("class", "dots");
  let visible = [], delaunay = null, current = null;

  const tickVals = (dom) => [100, 200, 500, 1e3, 2e3, 5e3, 1e4, 2e4, 5e4, 1e5, 2e5, 5e5, 1e6, 2e6, 5e6].filter((v) => v >= dom[0] && v <= dom[1]);

  function draw(mode) {
    const s = getState();
    const all = getCampaigns();
    visible = all.filter((c) => c.cost > 0 && c.pipeline > 0);
    const T = mode === "play" ? 0 : dur(520);
    if (visible.length) {
      x.domain([d3.min(visible, (c) => c.cost) * 0.8, d3.max(visible, (c) => c.cost) * 1.25]);
      y.domain([d3.min(visible, (c) => c.pipeline) * 0.8, d3.max(visible, (c) => c.pipeline) * 1.25]);
      r.domain([0, d3.max(visible, (c) => c.won) || 1]);
    }
    const xt = tickVals(x.domain()), yt = tickVals(y.domain());
    gridG.selectAll("line").data(yt, (d) => d).join("line").attr("class", "gridline").attr("x1", M.l).attr("x2", W - M.r).transition().duration(T).attr("y1", y).attr("y2", y);
    yAxis.selectAll("text").data(yt, (d) => d).join("text").attr("x", M.l - 8).attr("dy", ".32em").attr("text-anchor", "end").text(eur).transition().duration(T).attr("y", y);
    xAxis.selectAll("text").data(xt, (d) => d).join("text").attr("y", H - M.b + 18).attr("text-anchor", "middle").text(eur).transition().duration(T).attr("x", x);
    yAxis.selectAll("line").data(yt, (d) => d).join("line").attr("class", "tick-mark").attr("x1", M.l - 5).attr("x2", M.l).transition().duration(T).attr("y1", y).attr("y2", y);
    xAxis.selectAll("line").data(xt, (d) => d).join("line").attr("class", "tick-mark").attr("y1", H - M.b).attr("y2", H - M.b + 5).transition().duration(T).attr("x1", x).attr("x2", x);

    const lines = [1, 5, 10, 20].map((k) => {
      const x0 = Math.max(x.domain()[0], y.domain()[0] / k), x1 = Math.min(x.domain()[1], y.domain()[1] / k);
      return {k, x0, x1, ok: x0 < x1};
    }).filter((d) => d.ok);
    refs.selectAll("line").data(lines, (d) => d.k).join("line").attr("class", "refline")
      .transition().duration(T).attr("x1", (d) => x(d.x0)).attr("y1", (d) => y(d.k * d.x0)).attr("x2", (d) => x(d.x1)).attr("y2", (d) => y(d.k * d.x1));
    refs.selectAll("text").data(lines, (d) => d.k).join("text").attr("class", "reflabel").text((d) => `${d.k}×`)
      .transition().duration(T).attr("x", (d) => x(d.x1) + 4).attr("y", (d) => y(d.k * d.x1) + (d.x1 < x.domain()[1] ? -6 : 4));

    const on = (c) => !s.channels.size || s.channels.has(c.channel);
    const sel = dots.selectAll("circle").data(visible, (d) => d.id);
    sel.exit().interrupt().transition().duration(dur(260)).attr("r", 0).remove();
    const ent = sel.enter().append("circle").attr("class", "dot").attr("cx", (d) => x(d.cost)).attr("cy", (d) => y(d.pipeline)).attr("r", 0);
    const merged = ent.merge(sel)
      .style("fill", (d) => (on(d) ? chVar(d.channel) : "var(--color-mark-muted)"))
      .classed("match", (d) => matchQuery(d, s.query))
      .sort((a, b) => on(a) - on(b) || b.won - a.won);
    dots.classed("searching", !!s.query);
    if (mode === "play") {
      merged.interrupt().attr("cx", (d) => x(d.cost)).attr("cy", (d) => y(d.pipeline)).attr("r", 0)
        .transition().delay((d, i) => dur(i * (420 / visible.length))).duration(dur(420)).ease(EASE).attr("r", (d) => r(d.won));
    } else {
      merged.interrupt().transition().duration(T).ease(EASE).attr("cx", (d) => x(d.cost)).attr("cy", (d) => y(d.pipeline)).attr("r", (d) => r(d.won));
    }
    delaunay = d3.Delaunay.from(visible, (d) => x(d.cost), (d) => y(d.pipeline));
    el.querySelectorAll(".legend [data-ch]").forEach((n) => (n.style.opacity = !s.channels.size || s.channels.has(n.dataset.ch) ? 1 : 0.45));
    const noCost = all.filter((c) => c.cost == null).length;
    note.textContent = `${visible.length} campaigns with cost and pipeline in ${fmtMonth(s.range[0])} to ${fmtMonth(s.range[1])}. Dashed lines mark 1×, 5×, 10× and 20× pipeline to spend.${noCost ? ` ${noCost} campaigns have no recorded cost and are not plotted.` : ""}`;
  }

  function hover(d) {
    dots.classed("hovering", !!d);
    dots.selectAll("circle").classed("is-hover", (c) => c === d)
      .transition("h").duration(dur(120)).attr("r", (c) => r(c.won) * (c === d ? 1.15 : 1));
    if (!d) return tip.hide();
    dots.selectAll("circle").filter((c) => c === d).raise();
    tip.show(`<h4>${d.topic}</h4><div class="meta">${chName(d.channel)} · ${d.country} · launched ${fmtMonth(d.start)}</div><dl>
      <dt>Cost</dt><dd>${eur(d.cost)}</dd><dt>Pipeline</dt><dd>${eur(d.pipeline)}</dd><dt>Pipeline to spend</dt><dd>${ratio(d.pipeline / d.cost)}</dd>
      <dt>Cost per lead</dt><dd>${d.leads ? eur(d.cost / d.leads) : "–"}</dd><dt>Cost per opportunity</dt><dd>${d.opps ? eur(d.cost / d.opps) : "–"}</dd><dt>Won revenue</dt><dd>${eur(d.won)}</dd></dl>`,
      x(d.cost), y(d.pipeline), {width: W, height: H});
  }
  svg.on("pointermove pointerdown", (e) => {
    const [mx, my] = d3.pointer(e);
    const i = delaunay && visible.length ? delaunay.find(mx, my) : -1;
    const d = i >= 0 ? visible[i] : null;
    const near = d && Math.hypot(x(d.cost) - mx, y(d.pipeline) - my) < 28 ? d : null;
    if (near !== current) hover((current = near));
  }).on("pointerleave", () => hover((current = null)));

  draw("update");
  return {
    update: () => draw("update"),
    play: () => draw("play"),
    reset: () => dots.selectAll("circle").interrupt().attr("r", 0),
    highlight: (id) => hover((current = id ? visible.find((c) => c.id === id) ?? null : null))
  };
}
