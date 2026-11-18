import {d3, CHANNELS, sum, safeDiv} from "./core.js";

const STAGES = ["Discovery", "Demo", "Proposal", "Negotiation"];
export {STAGES};

export function prepare(raw) {
  const asOf = new Date(raw.meta.as_of);
  // The month of asOf is still partial, so charts stop at the last complete month.
  const lastMonth = d3.utcMonth.offset(d3.utcMonth.floor(d3.utcDay.offset(asOf, 1)), -1);
  const campaigns = new Map(raw.campaigns.map((c) => [c.campaign_id, c]));
  const months = raw.campaignMonths.filter((r) => r.month <= lastMonth);
  const firstMonth = d3.min(months, (r) => r.month);
  return {
    ...raw,
    asOf, lastMonth, firstMonth, campaigns, months,
    allMonths: d3.utcMonth.range(firstMonth, d3.utcMonth.offset(lastMonth, 1))
  };
}

export function defaultRange(m) {
  return [d3.utcMonth.offset(m.lastMonth, -11), m.lastMonth];
}

export function priorRange([a, b]) {
  const n = d3.utcMonth.count(a, b) + 1;
  return [d3.utcMonth.offset(a, -n), d3.utcMonth.offset(b, -n)];
}

export const inRange = (date, [a, b]) => date != null && date >= a && date < d3.utcMonth.offset(b, 1);

export function filters(m, s) {
  const campaign = (id) => {
    const c = m.campaigns.get(id);
    if (!c) return false;
    if (s.country !== "All" && c.country !== s.country) return false;
    if (s.channels.size && !s.channels.has(c.channel)) return false;
    return true;
  };
  const country = (id) => s.country === "All" || m.campaigns.get(id)?.country === s.country;
  return {campaign, country};
}

export function kpis(m, s, range) {
  const f = filters(m, s);
  const rows = m.months.filter((r) => inRange(r.month, range) && f.campaign(r.campaign_id));
  const costed = rows.filter((r) => r.cost_eur != null);
  const end = d3.utcMonth.offset(range[1], 1);
  return {
    pipeline: sum(rows, (r) => r.pipeline_created_eur),
    won: sum(rows, (r) => r.won_revenue_eur),
    ratio: safeDiv(sum(costed, (r) => r.pipeline_created_eur), sum(costed, (r) => r.cost_eur)),
    open: openAt(m, f, end),
    close: closeDays(m, f, range)
  };
}

function closeDays(m, f, range) {
  return d3.median(m.opportunities.filter((o) => o.is_closed && inRange(o.close_on, range) && f.campaign(o.campaign_id)), (o) => dayDiff(o.created_on, o.close_on));
}

function openAt(m, f, end) {
  return sum(m.opportunities, (o) =>
    f.campaign(o.campaign_id) && o.created_on < end && (!o.is_closed || o.close_on >= end) ? o.amount_eur : 0);
}

export function kpiSeries(m, s, range, key) {
  const f = filters(m, s);
  const months = d3.utcMonth.range(range[0], d3.utcMonth.offset(range[1], 1));
  if (key === "open") return months.map((mo) => openAt(m, f, d3.utcMonth.offset(mo, 1)));
  if (key === "close") return months.map((mo) => closeDays(m, f, [mo, mo]) ?? 0);
  const byMonth = d3.group(m.months.filter((r) => f.campaign(r.campaign_id)), (r) => +r.month);
  return months.map((mo) => {
    const rows = byMonth.get(+mo) ?? [];
    if (key === "pipeline") return sum(rows, (r) => r.pipeline_created_eur);
    if (key === "won") return sum(rows, (r) => r.won_revenue_eur);
    const c = rows.filter((r) => r.cost_eur != null);
    return safeDiv(sum(c, (r) => r.pipeline_created_eur), sum(c, (r) => r.cost_eur)) ?? 0;
  });
}

export function pipelineByChannelMonth(m, s) {
  const f = filters(m, s);
  const keys = [...CHANNELS, "Unattributed"];
  const byMonth = d3.rollup(
    m.months.filter((r) => f.country(r.campaign_id)),
    (v) => d3.rollup(v, (w) => sum(w, (r) => r.pipeline_created_eur), (r) => m.campaigns.get(r.campaign_id).channel),
    (r) => +r.month
  );
  return {
    keys,
    rows: m.allMonths.map((mo) => {
      const ch = byMonth.get(+mo) ?? new Map();
      return Object.assign({month: mo}, Object.fromEntries(keys.map((k) => [k, ch.get(k) ?? 0])));
    })
  };
}

export const FUNNEL = [
  ["members", "Members"], ["leads", "Leads"], ["mqls", "MQLs"], ["sqls", "SQLs"], ["opportunities", "Opportunities"], ["won_deals", "Won deals"]
];

export function funnel(m, s, range, onlyCountry = false) {
  const f = filters(m, s);
  const pass = onlyCountry ? f.country : f.campaign;
  const rows = m.months.filter((r) => inRange(r.month, range) && pass(r.campaign_id));
  return FUNNEL.map(([k, label], i) => {
    const n = sum(rows, (r) => r[k]);
    const prev = i ? sum(rows, (r) => r[FUNNEL[i - 1][0]]) : null;
    return {key: k, label, n, rate: i ? safeDiv(n, prev) : null};
  });
}

export function campaignTotals(m, s, range) {
  const f = filters(m, s);
  const rows = m.months.filter((r) => inRange(r.month, range) && f.campaign(r.campaign_id));
  return d3.rollups(rows, (v) => ({
    pipeline: sum(v, (r) => r.pipeline_created_eur),
    won: sum(v, (r) => r.won_revenue_eur),
    cost: v.some((r) => r.cost_eur != null) ? sum(v, (r) => r.cost_eur) : null,
    leads: sum(v, (r) => r.leads),
    mqls: sum(v, (r) => r.mqls),
    opps: sum(v, (r) => r.opportunities)
  }), (r) => r.campaign_id).map(([id, t]) => {
    const c = m.campaigns.get(id);
    return {id, ...t, channel: c.channel, country: c.country, topic: c.topic, start: c.start_on};
  }).filter((c) => c.channel !== "Unattributed");
}

export function channelTotals(campaigns) {
  return CHANNELS.map((ch) => {
    const v = campaigns.filter((c) => c.channel === ch);
    const costed = v.filter((c) => c.cost != null);
    const cost = sum(costed, (c) => c.cost);
    return {
      channel: ch,
      cost,
      pipeline: sum(v, (c) => c.pipeline),
      ratio: safeDiv(sum(costed, (c) => c.pipeline), cost),
      cpl: safeDiv(cost, sum(costed, (c) => c.leads)),
      cpm: safeDiv(cost, sum(costed, (c) => c.mqls)),
      cpo: safeDiv(cost, sum(costed, (c) => c.opps))
    };
  });
}

export function sourcedByChannel(m, s, range) {
  const f = filters(m, s);
  const rows = m.months.filter((r) => inRange(r.month, range) && f.country(r.campaign_id));
  const by = d3.rollup(rows, (v) => sum(v, (r) => r.pipeline_created_eur), (r) => m.campaigns.get(r.campaign_id).channel);
  const out = new Map([...CHANNELS, "Unattributed"].map((k) => [k, by.get(k) ?? 0]));
  out.total = d3.sum(out.values());
  return out;
}

const dayDiff = (a, b) => (b - a) / 864e5;

export function health(m, s, range) {
  const f = filters(m, s);
  const open = m.opportunities.filter((o) => !o.is_closed && f.campaign(o.campaign_id));
  const byStage = STAGES.map((st) => {
    const v = open.filter((o) => o.stage_name === st);
    const st30 = v.filter((o) => o.is_stalled);
    return {stage: st, amount: sum(v, (o) => o.amount_eur), count: v.length, stalled: st30.length, stalledAmount: sum(st30, (o) => o.amount_eur)};
  });
  const stalled = open.filter((o) => o.is_stalled).map((o) => ({
    ...o,
    idle: Math.round(dayDiff(o.last_stage_change_on, m.asOf)),
    campaign: m.campaigns.get(o.campaign_id)
  })).sort((a, b) => b.idle - a.idle);
  return {byStage, stalled, openTotal: sum(open, (o) => o.amount_eur), openCount: open.length};
}

export function quality(m, s, range) {
  const f = filters(m, s);
  const opps = m.opportunities.filter((o) => inRange(o.created_on, range) && f.country(o.campaign_id));
  const camps = campaignTotals(m, {...s, channels: new Set()}, range);
  const costs = channelTotals(camps);
  const rows = CHANNELS.map((ch) => {
    const v = opps.filter((o) => m.campaigns.get(o.campaign_id).channel === ch);
    const closed = v.filter((o) => o.is_closed), won = closed.filter((o) => o.is_won);
    const costed = camps.filter((c) => c.channel === ch && c.cost != null);
    return {
      channel: ch,
      created: v.length,
      closed: closed.length,
      won: won.length,
      winRate: closed.length >= 5 ? won.length / closed.length : null,
      avgDeal: d3.mean(won, (o) => o.won_amount_eur) ?? null,
      wonPerEur: safeDiv(sum(costed, (c) => c.won), costs.find((c) => c.channel === ch).cost)
    };
  });
  return {rows, open: opps.filter((o) => !o.is_closed).length, total: opps.length};
}

export function velocity(m, s, range) {
  const f = filters(m, s);
  const leadMql = m.leadVelocity.filter((r) => inRange(r.mql_on, range) && f.campaign(r.campaign_id) && r.lead_on).map((r) => dayDiff(r.lead_on, r.mql_on));
  const mqlOpp = m.leadVelocity.filter((r) => inRange(r.opportunity_on, range) && f.campaign(r.campaign_id)).map((r) => dayDiff(r.mql_on, r.opportunity_on));
  const oppClose = m.opportunities.filter((o) => o.is_closed && inRange(o.close_on, range) && f.campaign(o.campaign_id)).map((o) => dayDiff(o.created_on, o.close_on));
  return [
    {key: "lead_mql", label: "Lead to MQL", values: leadMql.filter((d) => d >= 0)},
    {key: "mql_opp", label: "MQL to opportunity", values: mqlOpp.filter((d) => d >= 0)},
    {key: "opp_close", label: "Opportunity to close", values: oppClose.filter((d) => d >= 0)}
  ].map((d) => ({...d, median: d3.median(d.values)}));
}

export function timeInStage(m, s, range) {
  const f = filters(m, s);
  const rows = m.stageHistory.filter((h) => h.days_in_stage != null && STAGES.includes(h.stage_name) && inRange(h.entered_on, range) && f.campaign(h.campaign_id));
  return STAGES.map((st) => {
    const v = rows.filter((h) => h.stage_name === st).map((h) => h.days_in_stage);
    return {stage: st, median: d3.median(v), n: v.length};
  });
}

export function attributionByChannel(m, s, range) {
  const f = filters(m, s);
  const rows = m.attribution.filter((r) => inRange(r.month, range) && f.country(r.campaign_id));
  const by = d3.rollup(rows, (v) => sum(v, (r) => r.pipeline_created_eur), (r) => r.model, (r) => m.campaigns.get(r.campaign_id).channel);
  const keys = [...CHANNELS, "Unattributed"];
  const models = ["first_touch", "last_touch", "linear"];
  const out = Object.fromEntries(models.map((md) => [md, new Map(keys.map((k) => [k, by.get(md)?.get(k) ?? 0]))]));
  out.total = d3.sum(out.first_touch.values());
  return out;
}
