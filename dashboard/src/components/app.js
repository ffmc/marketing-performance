import {d3, CHANNELS, COUNTRIES, DEFINITIONS, chVar, chName, listNames, eur, ratio, pct, int, days, fmtMonth, fmtDate, reveal} from "./core.js";
import * as model from "./model.js";
import {KPIs} from "./kpis.js";
import {PipelineArea} from "./area.js";
import {Funnel} from "./funnel.js";
import {Scatter, matchQuery} from "./scatter.js";
import {Table} from "./table.js";
import {Attribution, Influence, Touches, MODELS} from "./attribution.js";
import {Velocity, StageTime} from "./speed.js";
import {OpenByStage, StageFlow} from "./health.js";

const monthParam = d3.utcFormat("%Y-%m"), parseMonth = d3.utcParse("%Y-%m");

function readUrl(m) {
  const q = new URLSearchParams(location.search);
  const range = [parseMonth(q.get("from") ?? ""), parseMonth(q.get("to") ?? "")];
  const valid = range[0] && range[1] && range[0] <= range[1] && range[0] >= m.firstMonth && range[1] <= m.lastMonth;
  return {
    country: ["ES", "GB", "US"].includes(q.get("country")) ? q.get("country") : "All",
    channels: new Set((q.get("channels") ?? "").split(",").filter((c) => CHANNELS.includes(c))),
    model: MODELS.some(([k]) => k === q.get("model")) ? q.get("model") : "first_touch",
    range: valid ? range : model.defaultRange(m),
    query: ""
  };
}

function writeUrl(s, m) {
  const q = new URLSearchParams();
  if (s.country !== "All") q.set("country", s.country);
  if (s.channels.size) q.set("channels", [...s.channels].join(","));
  if (s.model !== "first_touch") q.set("model", s.model);
  const [a, b] = model.defaultRange(m);
  if (+s.range[0] !== +a || +s.range[1] !== +b) { q.set("from", monthParam(s.range[0])); q.set("to", monthParam(s.range[1])); }
  history.replaceState(null, "", `${location.pathname}${q.size ? `?${q}` : ""}${location.hash}`);
}

export function app(root, raw) {
  const m = model.prepare(raw);
  const state = readUrl(m);
  const getState = () => state;
  let comps = [];

  root.querySelector("[data-trust]").innerHTML = trustBadge(raw.meta);
  root.querySelectorAll("[data-info]").forEach((b) => {
    const text = b.dataset.info.split(" ").map((k) => DEFINITIONS[k]).join(" ");
    b.dataset.def = text;
    b.setAttribute("aria-label", `Definition: ${text}`);
  });

  const cs = root.querySelector("#country-seg");
  cs.innerHTML = ["All", "ES", "GB", "US"].map((c) => `<button type="button" role="radio" data-c="${c}">${c === "All" ? "All countries" : c}</button>`).join("");
  cs.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => setState({country: b.dataset.c})));
  const chips = root.querySelector("#channel-chips");
  chips.innerHTML = `<button type="button" class="chip" data-all>All channels</button>` +
    CHANNELS.map((c) => `<button type="button" class="chip" data-ch="${c}" style="--c: ${chVar(c)}">${c}</button>`).join("");
  chips.querySelectorAll(".chip").forEach((b) => b.addEventListener("click", () => {
    const next = new Set(state.channels);
    if (!b.dataset.ch) next.clear();
    else if (next.has(b.dataset.ch)) next.delete(b.dataset.ch);
    else next.add(b.dataset.ch);
    if (next.size === CHANNELS.length) next.clear();
    setState({channels: next});
  }));

  const search = root.querySelector("#campaign-search");
  search.addEventListener("input", () => setState({query: search.value.trim().toLowerCase()}));

  function syncControls() {
    cs.querySelectorAll("button").forEach((b) => b.setAttribute("aria-checked", b.dataset.c === state.country));
    chips.querySelectorAll(".chip").forEach((b) => b.setAttribute("aria-pressed", b.dataset.all !== undefined ? !state.channels.size : state.channels.has(b.dataset.ch)));
  }

  function setState(patch) {
    Object.assign(state, patch);
    syncControls();
    writeUrl(state, m);
    comps.forEach((c) => c.update());
    fillText();
  }

  const campaignsInRange = () => model.campaignTotals(m, state, state.range);

  function mount() {
    const at = (name) => root.querySelector(`[data-c="${name}"]`);
    const scatter = Scatter(at("scatter"), campaignsInRange, getState);
    const list = {
      kpis: KPIs(at("kpis"), m, getState),
      area: PipelineArea(at("area"), m, getState, setState),
      funnel: Funnel(at("funnel"), m, getState),
      scatter,
      channels: Table(at("channels"), {
        sortKey: "ratio",
        columns: [
          {k: "channel", l: "Channel", txt: true, v: (r) => r.channel, f: (r) => chName(r.channel)},
          {k: "cost", l: "Cost", v: (r) => r.cost, f: (r) => eur(r.cost)},
          {k: "pipeline", l: "Pipeline", v: (r) => r.pipeline, f: (r) => eur(r.pipeline)},
          {k: "ratio", l: "Pipeline to spend", v: (r) => r.ratio, f: (r) => ratio(r.ratio)},
          {k: "cpl", l: "Cost per lead", v: (r) => r.cpl, f: (r) => eur(r.cpl)},
          {k: "cpm", l: "Cost per MQL", v: (r) => r.cpm, f: (r) => eur(r.cpm)},
          {k: "cpo", l: "Cost per opp.", v: (r) => r.cpo, f: (r) => eur(r.cpo)}
        ],
        rows: () => model.channelTotals(model.campaignTotals(m, {...state, channels: new Set()}, state.range)).map((r) => ({...r, id: r.channel})),
        empty: () => "No campaigns in this period."
      }),
      campaigns: Table(at("campaigns"), {
        sortKey: "pipeline",
        columns: [
          {k: "topic", l: "Campaign", txt: true, v: (r) => r.topic, f: (r) => `<span class="cname"><i style="background:${chVar(r.channel)}"></i>${r.topic}</span>`},
          {k: "channel", l: "Channel", txt: true, v: (r) => r.channel, f: (r) => chName(r.channel)},
          {k: "country", l: "Country", txt: true, v: (r) => r.country, f: (r) => r.country},
          {k: "start", l: "Launched", v: (r) => r.start, f: (r) => (r.start ? fmtMonth(r.start) : "–")},
          {k: "cost", l: "Cost", v: (r) => r.cost, f: (r) => (r.cost == null ? `<span class="dim">Not recorded</span>` : eur(r.cost))},
          {k: "pipeline", l: "Pipeline", v: (r) => r.pipeline, f: (r) => eur(r.pipeline)},
          {k: "ratio", l: "Pipeline to spend", v: (r) => (r.cost ? r.pipeline / r.cost : null), f: (r) => (r.cost ? ratio(r.pipeline / r.cost) : "–")},
          {k: "cpl", l: "Cost per lead", v: (r) => (r.cost && r.leads ? r.cost / r.leads : null), f: (r) => (r.cost && r.leads ? eur(r.cost / r.leads) : "–")},
          {k: "cpo", l: "Cost per opp.", v: (r) => (r.cost && r.opps ? r.cost / r.opps : null), f: (r) => (r.cost && r.opps ? eur(r.cost / r.opps) : "–")},
          {k: "won", l: "Won revenue", v: (r) => r.won, f: (r) => eur(r.won)}
        ],
        rows: () => campaignsInRange().filter((c) => matchQuery(c, state.query)),
        onHover: (id) => scatter.highlight(id),
        empty: () => `No campaigns match${state.query ? ` "${state.query.replace(/[<>&"]/g, "")}"` : ""}. Clear the search or pick other channels.`,
        footnote: (n) => `${int(n)} campaigns active in the period. Scroll the table to see them all; hover a row to find it in the chart above.`
      }),
      attribution: Attribution(at("attribution"), m, getState, setState),
      influence: Influence(at("influence"), m, getState),
      touches: Touches(at("touches"), m, getState),
      velocity: Velocity(at("velocity"), m, getState),
      stages: StageTime(at("stages"), m, getState),
      open: OpenByStage(at("open"), m, getState),
      flow: StageFlow(at("flow"), m, getState),
      stalled: Table(at("stalled"), {
        sortKey: "idle",
        columns: [
          {k: "id", l: "Opportunity", txt: true, v: (r) => r.opportunity_id, f: (r) => `<span class="num">…${r.opportunity_id.slice(-6)}</span>`},
          {k: "campaign", l: "Source campaign", txt: true, v: (r) => r.campaign?.topic ?? "Unattributed", f: (r) => r.campaign?.topic ?? "Unattributed"},
          {k: "channel", l: "Channel", txt: true, v: (r) => r.campaign?.channel, f: (r) => (CHANNELS.includes(r.campaign?.channel) ? chName(r.campaign.channel) : "–")},
          {k: "stage", l: "Stage", txt: true, v: (r) => r.stage_name, f: (r) => r.stage_name},
          {k: "amount", l: "Amount", v: (r) => r.amount_eur, f: (r) => eur(r.amount_eur)},
          {k: "idle", l: "Days without a stage change", v: (r) => r.idle, f: (r) => int(r.idle)}
        ],
        rows: () => model.health(m, state, state.range).stalled.map((r) => ({...r, id: r.opportunity_id})),
        empty: () => "No stalled opportunities for this selection."
      })
    };
    comps = Object.values(list);
    for (const [name, comp] of Object.entries(list)) reveal(at(name), comp);
  }

  function fillText() {
    const s = state;
    const k = model.kpis(m, s, s.range), prior = model.kpis(m, s, model.priorRange(s.range));
    const att = model.attributionByChannel(m, s, s.range);
    const pool = s.channels.size ? [...s.channels] : CHANNELS;
    const top = pool.map((c) => [c, att.first_touch.get(c)]).sort((a, b) => b[1] - a[1])[0];
    const steps = model.funnel(m, s, s.range).slice(2);
    const drop = steps.reduce((a, b) => ((b.rate ?? 1) < (a.rate ?? 1) ? b : a));
    const dropFrom = model.FUNNEL[model.FUNNEL.findIndex(([key]) => key === drop.key) - 1][1];
    const eff = model.channelTotals(model.campaignTotals(m, {...s, channels: new Set()}, s.range)).filter((c) => c.ratio != null).sort((a, b) => b.ratio - a.ratio);
    // Channels under 5% of sourced pipeline are left out so a tiny base cannot produce a four-digit headline.
    const gain = (md) => CHANNELS.filter((c) => att.first_touch.get(c) >= 0.05 * att.total).map((c) => [c, att[md].get(c) / att.first_touch.get(c) - 1]).sort((a, b) => b[1] - a[1])[0] ?? [CHANNELS[0], 0];
    const lin = gain("linear");
    const vel = model.velocity(m, s, s.range);
    const slowest = model.timeInStage(m, s, s.range).filter((d) => d.median != null).sort((a, b) => b.median - a.median)[0];
    const h = model.health(m, s, s.range);
    const stalledAmount = d3.sum(h.stalled, (o) => o.amount_eur);
    const growth = prior.pipeline ? k.pipeline / prior.pipeline - 1 : null;
    const t = {
      scope: s.country === "All" ? "Spain, the UK and the US" : COUNTRIES[s.country],
      period: `${fmtMonth(s.range[0])} to ${fmtMonth(s.range[1])}`,
      who: s.channels.size ? `${listNames(CHANNELS.filter((c) => s.channels.has(c)).map(chName))} campaigns` : "Campaigns",
      pipeline: eur(k.pipeline),
      won: eur(k.won),
      top: top && top[1] ? chName(top[0]) : "No channel",
      topShare: pct(top?.[1] / (att.total || 1), 0),
      growth: growth == null ? "" : `Pipeline is ${growth >= 0 ? "up" : "down"} ${pct(Math.abs(growth), 0)} on the previous period of the same length.`,
      dropFrom: dropFrom.toLowerCase(),
      dropTo: drop.label.toLowerCase(),
      dropRate: pct(drop.rate, 0),
      best: eff[0] ? chName(eff[0].channel) : "–",
      bestRatio: eff[0] ? `€${eff[0].ratio.toFixed(1)}` : "–",
      worst: eff.at(-1) ? chName(eff.at(-1).channel) : "–",
      worstRatio: eff.at(-1) ? `€${eff.at(-1).ratio.toFixed(1)}` : "–",
      lin: chName(lin[0]),
      linPct: pct(Math.max(0, lin[1]), 0),
      close: days(vel[2].median),
      leadMql: days(vel[0].median),
      slowest: slowest ? slowest.stage : "–",
      slowestDays: slowest ? days(slowest.median) : "–",
      stalledCount: int(h.stalled.length),
      stalledAmount: eur(stalledAmount),
      openTotal: eur(h.openTotal)
    };
    root.querySelectorAll("[data-t]").forEach((n) => { n.innerHTML = t[n.dataset.t] ?? ""; });
  }

  syncControls();
  fillText();
  mount();

  let lastWidth = innerWidth, timer;
  addEventListener("resize", () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (Math.abs(innerWidth - lastWidth) < 24) return;
      lastWidth = innerWidth;
      mount();
    }, 200);
  });
}

function trustBadge(meta) {
  const ok = `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8.5l3 3 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const tests = meta.tests ? ` · ${int(meta.tests.passed)} of ${int(meta.tests.total)} dbt tests passed` : " · published only after every dbt test passes";
  return `<span class="trust">${ok}Data to ${fmtDate(new Date(meta.as_of))}${tests}</span>`;
}
