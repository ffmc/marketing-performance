import {d3, CHANNELS, chVar, chName, dur, EASE, int, pct, svgIn, tooltip} from "./core.js";
import {funnel} from "./model.js";
import {sankey, sankeyLeft, sankeyLinkHorizontal} from "npm:d3-sankey";

// Each stage splits into the people who moved on and the people who did not; the lost flow ends in a muted stub.
export function Funnel(el, m, getState) {
  el.innerHTML = `<div class="legend">${CHANNELS.map((c) => `<span data-ch="${c}"><i style="background:${chVar(c)}"></i>${c}</span>`).join("")}<span><i class="swatch-lost"></i>Did not move on</span></div><div class="chart-wrap"></div><p class="footnote funnel-note"></p>`;
  const wrap = el.querySelector(".chart-wrap");
  const compact = wrap.clientWidth < 560;
  const H = compact ? 380 : 400, M = {t: 62, r: compact ? 8 : 24, b: 8, l: 4};
  const {svg, width: W} = svgIn(wrap, H);
  svg.attr("role", "img").attr("aria-label", "Flow of people from joining a campaign to a won deal");
  const tip = tooltip(wrap);
  const linksG = svg.append("g").attr("fill", "none");
  const nodesG = svg.append("g");
  const labelsG = svg.append("g");
  const clipId = `funnel-clip-${Math.random().toString(36).slice(2)}`;
  const clip = svg.append("clipPath").attr("id", clipId).append("rect").attr("height", H).attr("width", W);
  linksG.attr("clip-path", `url(#${clipId})`);
  const link = sankeyLinkHorizontal();
  const band = d3.linkHorizontal().source((d) => [d.x0, d.ya]).target((d) => [d.x1, d.yb]);

  function layout(stages) {
    const nodes = [], links = [];
    stages.forEach((st, i) => {
      nodes.push({id: `s${i}`, label: st.label, n: st.n, rate: st.rate, kind: "stage"});
      if (i) {
        const prev = stages[i - 1];
        links.push({source: `s${i - 1}`, target: `s${i}`, value: Math.max(st.n, 0.0001), kind: "flow"});
        const lost = Math.max(prev.n - st.n, 0);
        nodes.push({id: `l${i}`, label: "", n: lost, kind: "lost", from: prev.label});
        links.push({source: `s${i - 1}`, target: `l${i}`, value: Math.max(lost, 0.0001), kind: "lost"});
      }
    });
    const gen = sankey().nodeId((d) => d.id).nodeWidth(compact ? 10 : 14).nodePadding(compact ? 10 : 16).nodeSort(null).nodeAlign(sankeyLeft)
      .extent([[M.l, M.t], [W - M.r, H - M.b]]);
    return gen({nodes, links});
  }

  let first = true;
  function draw(mode) {
    const s = getState();
    const stages = funnel(m, s, s.range);
    const {nodes, links} = layout(stages);
    const T = mode === "play" ? 0 : dur(520);
    const chans = CHANNELS.filter((c) => !s.channels.size || s.channels.has(c));
    const byCh = new Map(chans.map((c) => [c, funnel(m, {...s, channels: new Set([c])}, s.range)]));

    const bands = links.flatMap((d) => {
      if (d.kind === "lost") return [{...d, key: `${d.source.id}>${d.target.id}`, x0: d.source.x1, x1: d.target.x0, ya: d.y0, yb: d.y1, w: d.width}];
      const i = +d.target.id.slice(1), total = d.target.n || 1;
      const parts = chans.map((c) => ({ch: c, n: byCh.get(c)[i].n, prev: byCh.get(c)[i - 1].n}));
      const rest = Math.max(0, d.target.n - d3.sum(parts, (p) => p.n));
      if (rest > 0) parts.push({ch: "Unattributed", n: rest, prev: null});
      let off = 0;
      return parts.map((p) => {
        const w = (p.n / total) * d.width, mid = off + w / 2;
        off += w;
        return {...d, ...p, key: `${d.source.id}>${d.target.id}:${p.ch}`, x0: d.source.x1, x1: d.target.x0, ya: d.y0 - d.width / 2 + mid, yb: d.y1 - d.width / 2 + mid, w};
      });
    });

    const l = linksG.selectAll("path").data(bands, (d) => d.key).join("path")
      .attr("class", (d) => `sk-link ${d.kind}`)
      .style("--flow", (d) => (d.kind === "flow" ? chVar(d.ch) : null));
    (first || mode === "play" ? l : l.transition().duration(T).ease(EASE)).attr("d", band).attr("stroke-width", (d) => (d.w > 0 ? Math.max(0.5, d.w) : 0));
    l.on("pointerenter", function (e, d) {
      linksG.classed("hovering", true); d3.select(this).classed("is-hover", true);
      const [px, py] = d3.pointer(e, svg.node());
      const from = stages[+d.source.id.slice(1)];
      const html = d.kind === "flow"
        ? `<h4>${from.label} to ${d.target.label}</h4><div class="meta">${d.ch === "Unattributed" ? d.ch : chName(d.ch)}</div><dl><dt>People</dt><dd>${int(d.n)}</dd>${d.prev != null ? `<dt>Share of ${from.label}</dt><dd>${pct(d.prev ? d.n / d.prev : null)}</dd>` : ""}</dl>`
        : `<h4>Did not move on from ${from.label}</h4><dl><dt>People</dt><dd>${int(d.target.n)}</dd><dt>Share of ${from.label}</dt><dd>${pct(from.n ? d.target.n / from.n : null)}</dd></dl>`;
      tip.show(html, px, py, {width: W, height: H});
    }).on("pointerleave", function () { linksG.classed("hovering", false); d3.select(this).classed("is-hover", false); tip.hide(); });
    el.querySelectorAll(".legend [data-ch]").forEach((n) => (n.style.opacity = chans.includes(n.dataset.ch) ? 1 : 0.45));

    const nd = nodesG.selectAll("rect").data(nodes, (d) => d.id).join("rect").attr("class", (d) => `sk-node ${d.kind}`).attr("rx", 2);
    (first || mode === "play" ? nd : nd.transition().duration(T).ease(EASE))
      .attr("x", (d) => d.x0).attr("y", (d) => d.y0).attr("width", (d) => d.x1 - d.x0).attr("height", (d) => Math.max(1, d.y1 - d.y0));

    const stageNodes = nodes.filter((d) => d.kind === "stage");
    const lab = labelsG.selectAll("g").data(stageNodes, (d) => d.id).join((en) => {
      const g = en.append("g").attr("class", "sk-label");
      g.append("text").attr("class", "sk-name");
      g.append("text").attr("class", "sk-n");
      g.append("text").attr("class", "sk-rate");
      return g;
    });
    const short = {Opportunities: "Opps", "Won deals": "Won"};
    const name = (d) => (compact ? short[d.label] ?? d.label : d.label === "Won deals" ? "Won" : d.label);
    lab.each(function (d, i) {
      const g = d3.select(this);
      const last = i === stageNodes.length - 1;
      const x = last ? d.x1 : d.x0, anchor = last ? "end" : "start";
      g.select(".sk-name").attr("x", x).attr("y", 14).attr("text-anchor", anchor).text(name(d));
      g.select(".sk-n").attr("x", x).attr("y", 32).attr("text-anchor", anchor).text(int(d.n));
      g.select(".sk-rate").attr("x", x).attr("y", 47).attr("text-anchor", anchor).text(i ? pct(d.rate) : "joined");
    });
    el.querySelector(".funnel-note").textContent = `${int(stages[0].n)} people joined a campaign in the period and ${int(stages.at(-1).n)} became won deals (${pct(stages.at(-1).n / stages[0].n)}). Percentages show the share that moved on from the stage before.`;
    first = false;
  }

  function reveal() {
    clip.attr("width", 0).transition().duration(dur(1000)).ease(EASE).attr("width", W);
  }
  draw("update");
  return {update: () => draw("update"), play: () => { draw("play"); reveal(); }, reset: () => clip.attr("width", 0)};
}
