const SF_NAMES = {
  users: "User", accounts: "Account", campaigns: "Campaign", leads: "Lead", contacts: "Contact",
  campaign_members: "CampaignMember", opportunities: "Opportunity",
  opportunity_contact_roles: "OpportunityContactRole", opportunity_history: "OpportunityHistory"
};
const snake = (s) => s.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();

const TABLE_LAYOUT = {
  campaigns: [0, 0], opportunities: [2, 0], users: [3, 0],
  campaign_members: [0, 1], leads: [1, 1], accounts: [2, 1], opportunity_history: [3, 1],
  contacts: [1, 2], opportunity_contact_roles: [3, 2]
};
const MART_LAYOUT = {
  fct_opportunity_stage_history: [0, 0], fct_opportunities: [1, 0], dim_accounts: [2, 0],
  fct_touchpoints: [0, 1], mart_campaign_performance: [1, 1],
  fct_campaign_funnel: [0, 2], dim_campaigns: [1, 2], mart_campaign_attribution: [2, 2]
};

const STAGES = [
  {key: "salesforce", name: "Salesforce", note: "Daily extracts", title: "Where the data starts",
    text: "A simulated CRM for a fictional company. Salesforce re-sends the whole record every time it changes, and the data has real-world problems such as duplicate leads. These are the objects extracted each day.",
    table: (t) => SF_NAMES[t.name], column: (c) => c},
  {key: "raw", name: "Snowflake RAW", note: "Loaded as delivered", title: "Loaded exactly as delivered",
    text: "The same objects land in Snowflake untouched. Nothing is fixed or removed, so every delivery is kept and the original is always there to go back to.",
    table: (t) => t.name.toUpperCase(), prefix: "RAW.SALESFORCE.", column: (c) => c},
  {key: "silver", name: "Silver", note: "Cleaned and checked", title: "Typed, deduplicated, still complete",
    text: "One typed table per object, with columns renamed to snake case and duplicate deliveries removed. Full history is kept and deleted records stay as a flag. No business logic yet, that happens in dbt.",
    table: (t) => t.name, prefix: "SILVER.SALESFORCE.", column: snake},
  {key: "dbt", name: "dbt", note: "Modelled and tested", title: "Where business logic lives"}
];

const esc = (s) => String(s ?? "").replace(/[<>&"]/g, (c) => ({"<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;"}[c]));
const firstSentence = (s) => (s.match(/^.*?\.(\s|$)/)?.[0] ?? s).trim();

let uid = 0;
const HEAD = 34, LINE = 19;

function erd({nodes, edges, cols, rows, cellW, cellH, w, label, detailFor}) {
  const W = cols * cellW, H = rows * cellH, id = `erd${++uid}`;
  const pos = new Map(nodes.map((n, i) => {
    const h = HEAD + 12 + n.lines.length * LINE;
    return [n.id, {...n, h, i, x: n.col * cellW + (cellW - w) / 2, y: n.row * cellH + (cellH - h) / 2}];
  }));
  const rowY = (n, text) => n.y + HEAD + 15 + Math.max(0, n.lines.findIndex((l) => l.text === text)) * LINE;
  const edgeEls = edges.map((e, i) => {
    const a = pos.get(e.from), b = pos.get(e.to);
    if (!a || !b) return "";
    const same = a.col === b.col, dir = same ? -1 : Math.sign(b.col - a.col);
    const x1 = dir > 0 || same ? (same ? a.x : a.x + w) : a.x, y1 = rowY(a, e.label);
    const x2 = same ? b.x : dir > 0 ? b.x : b.x + w, y2 = rowY(b, e.field);
    const k = same ? 44 : Math.max(36, Math.abs(x2 - x1) / 2);
    const ex = same ? -1 : -dir;
    const line = `M${x1},${y1} C${x1 + dir * k},${y1} ${x2 + ex * k},${y2} ${x2},${y2}`;
    const s = 6, f = 11;
    const crow = `M${x1 + dir * f},${y1} L${x1},${y1 - s} M${x1 + dir * f},${y1} L${x1},${y1} M${x1 + dir * f},${y1} L${x1},${y1 + s}`;
    const one = `M${x2 + ex * 8},${y2 - s} L${x2 + ex * 8},${y2 + s}`;
    return `<g class="edge" data-from="${a.id}" data-to="${b.id}" data-fk="${esc(e.label)}" data-pk="${esc(e.field ?? "")}" style="--i: ${i}">
      <path class="e-line" pathLength="1" d="${line}"/>
      <path class="e-flow" d="${line}"/>
      <path class="e-end" d="${crow} ${one}"/></g>`;
  }).join("");
  const r = 10;
  const nodeEls = [...pos.values()].map((n) => `
    <g transform="translate(${n.x},${n.y})"><g class="node" tabindex="0" data-id="${n.id}" style="--i: ${n.i}">
      <rect class="n-body" width="${w}" height="${n.h}" rx="${r}"/>
      <path class="n-head" d="M0,${HEAD} V${r} Q0,0 ${r},0 H${w - r} Q${w},0 ${w},${r} V${HEAD} Z"/>
      <text class="n-name" x="14" y="22">${esc(n.label)}</text>
      ${n.lines.map((l, j) => `<g class="n-row" data-col="${esc(l.text)}" transform="translate(14,${HEAD + 20 + j * LINE})">${l.tag ? `<text class="n-tag">${l.tag}</text>` : ""}<text class="n-col${l.tag ? "" : " muted"}" x="${l.tag ? 26 : 0}">${esc(l.text)}</text></g>`).join("")}
    </g></g>`).join("");
  return {
    svg: `<div class="erd-scroll"><svg class="erd" viewBox="-8 -8 ${W + 16} ${H + 16}" role="group" aria-label="${esc(label)}">
      <defs><filter id="${id}-glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <g class="edges" style="--glow: url(#${id}-glow)">${edgeEls}</g>${nodeEls}</svg></div>`,
    wire(host) {
      const svg = host.querySelector(".erd"), detail = host.querySelector(".erd-detail");
      const base = detail.textContent;
      const set = (id) => {
        svg.classList.toggle("hovering", !!id);
        const linked = new Set(id ? [id] : []);
        svg.querySelectorAll(".edge").forEach((e) => {
          const on = !!id && (e.dataset.from === id || e.dataset.to === id);
          e.classList.toggle("on", on);
          if (on) { linked.add(e.dataset.from); linked.add(e.dataset.to); }
        });
        svg.querySelectorAll(".node").forEach((n) => n.classList.toggle("on", linked.has(n.dataset.id)));
        svg.querySelectorAll(".n-row.hot").forEach((r) => r.classList.remove("hot"));
        svg.querySelectorAll(".edge.on").forEach((e) => {
          svg.querySelector(`.node[data-id="${e.dataset.from}"] .n-row[data-col="${e.dataset.fk}"]`)?.classList.add("hot");
          svg.querySelector(`.node[data-id="${e.dataset.to}"] .n-row${e.dataset.pk ? `[data-col="${e.dataset.pk}"]` : ""}`)?.classList.add("hot");
        });
        detail.textContent = id ? detailFor(id) : base;
      };
      svg.querySelectorAll(".node").forEach((n) => {
        n.addEventListener("pointerenter", () => set(n.dataset.id));
        n.addEventListener("focus", () => set(n.dataset.id));
        n.addEventListener("pointerleave", () => set(null));
        n.addEventListener("blur", () => set(null));
      });
    }
  };
}

function tablesPanel(stage, data) {
  const byName = new Map(data.tables.map((t) => [t.name, t]));
  const pk = (t) => (stage.key === "silver" ? t.columns.find((c) => c.endsWith("_id")) ?? "id" : "Id");
  const edges = data.tableEdges.map((e) => ({...e, label: stage.column(e.column), field: pk(byName.get(e.to))}));
  const nodes = data.tables.filter((t) => TABLE_LAYOUT[t.name]).map((t) => ({
    id: t.name, label: stage.table(t), col: TABLE_LAYOUT[t.name][0], row: TABLE_LAYOUT[t.name][1],
    lines: [{tag: "PK", text: pk(t)}, ...edges.filter((e) => e.from === t.name).map((e) => ({tag: "FK", text: e.label}))]
  }));
  const detailFor = (id) => {
    const t = byName.get(id);
    const links = edges.filter((e) => e.from === id).map((e) => `${e.label} points to ${stage.table(byName.get(e.to))}`);
    return `${stage.prefix ?? ""}${stage.table(t)}. ${t.description}${links.length ? ` Links: ${links.join("; ")}.` : ""}`;
  };
  return erd({nodes, edges, cols: 4, rows: 3, cellW: 296, cellH: 150, w: 244, label: `${stage.name} tables and how they connect`, detailFor});
}

function martsPanel(data) {
  const byName = new Map(data.marts.map((m) => [m.name, m]));
  const nodes = data.marts.filter((m) => MART_LAYOUT[m.name]).map((m) => {
    const keys = m.columns.filter((c) => c.pk || c.fk).map((c) => ({tag: c.pk ? "PK" : "FK", text: c.name}));
    return {id: m.name, label: m.name, col: MART_LAYOUT[m.name][0], row: MART_LAYOUT[m.name][1], lines: keys.length ? keys : [{text: "aggregated for reporting"}]};
  });
  const edges = data.martEdges.map((e) => ({from: e.from, to: e.to, label: e.column, field: e.field}));
  const detailFor = (id) => `${id}. ${firstSentence(byName.get(id).description)}`;
  return erd({nodes, edges, cols: 3, rows: 3, cellW: 380, cellH: 120, w: 270, label: "dbt marts and how they connect", detailFor});
}

function intermediateList(data) {
  const groups = Map.groupBy(data.intermediate, (m) => m.group);
  return `<div class="models-list">${[...groups].map(([g, ms]) => `
    <div><h4>${esc(g.replace("/", " · "))}</h4><ul>${ms.map((m) => `<li><code>${esc(m.name)}</code><span>${esc(firstSentence(m.description))}</span></li>`).join("")}</ul></div>`).join("")}</div>`;
}

export function Lineage(el, data) {
  const dbtTests = data.tests.yaml + data.tests.singular;
  el.innerHTML = `
    <p class="lineage-hint">Click a stage to see the tables and models behind it.</p>
    <ol class="stages">
      ${STAGES.map((s) => `<li><button type="button" class="stage" data-key="${s.key}" aria-expanded="false" aria-controls="lineage-panel"><b>${s.name}</b><span>${s.note}</span><i class="chev" aria-hidden="true"></i></button></li>`).join("")}
      <li class="stage final"><b>This page</b><span>Built when every test passes</span></li>
    </ol>
`;
  el.insertAdjacentHTML("afterend", `<div id="lineage-panel" class="lineage-panel" hidden></div>`);
  const panel = el.nextElementSibling, buttons = [...el.querySelectorAll("button.stage")];
  let open = null;

  function render(stage) {
    let body, wire;
    if (stage.key === "dbt") {
      const mp = martsPanel(data);
      body = `${mp.svg}<p class="erd-detail">Hover or focus a model to see what it holds.</p>
        <h4 class="list-title">Intermediate models</h4>${intermediateList(data)}`;
      wire = (host) => mp.wire(host);
    } else {
      const tp = tablesPanel(stage, data);
      body = `${tp.svg}<p class="erd-detail">Hover or focus a table to see what it holds and what it points to.</p>`;
      wire = (host) => tp.wire(host);
    }
    const dbtText = `Picks each record's current state, resolves people by email, credits every deal to one source campaign, and builds the ${data.marts.length} marts below. ${dbtTests} tests run on every build and the page only refreshes when they pass.`;
    panel.innerHTML = `<div class="panel-head"><h3>${stage.title}</h3><p>${stage.key === "dbt" ? dbtText : stage.text}</p></div><div class="panel-body">${body}</div>`;
    wire(panel);
  }

  function toggle(key) {
    open = open === key ? null : key;
    buttons.forEach((b) => b.setAttribute("aria-expanded", b.dataset.key === open));
    if (!open) { panel.hidden = true; panel.innerHTML = ""; return; }
    panel.hidden = false;
    render(STAGES.find((s) => s.key === open));
  }
  buttons.forEach((b) => b.addEventListener("click", (e) => { e.stopPropagation(); toggle(b.dataset.key); }));
  el.parentElement.addEventListener("keydown", (e) => { if (e.key === "Escape" && open) { const k = open; toggle(k); el.querySelector(`[data-key="${k}"]`).focus(); } });
  document.addEventListener("click", (e) => { if (open && !el.contains(e.target) && !panel.contains(e.target)) toggle(open); });
}
