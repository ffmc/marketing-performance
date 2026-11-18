import {readdirSync, readFileSync, statSync} from "node:fs";
import {join, relative, sep} from "node:path";
import {fileURLToPath} from "node:url";
import {load} from "js-yaml";

const dbt = fileURLToPath(new URL("../../../dbt/", import.meta.url));

const walk = (dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : [p];
});
const parse = (dir, suffix) => walk(join(dbt, dir)).filter((p) => p.endsWith(suffix)).map((p) => ({path: p, doc: load(readFileSync(p, "utf8"))}));
const refName = (s) => /ref\('([^']+)'\)/.exec(s)?.[1];
const grain = (d = "") => d.replace(/\s+/g, " ").trim();

const models = parse("models", ".yml").flatMap(({path, doc}) => (doc.models ?? []).map((m) => ({...m, group: relative(join(dbt, "models"), path).split(sep).slice(0, -1).join("/")})));
const sources = parse("models/sources", ".yml").flatMap(({doc}) => doc.sources ?? []);

const testsOf = (t = []) => t.map((x) => (typeof x === "string" ? x : Object.keys(x)[0]));
const edges = [];
for (const m of models) for (const c of m.columns ?? []) for (const t of c.data_tests ?? []) {
  const to = typeof t === "object" && t.relationships ? refName(t.relationships.arguments.to) : null;
  if (to) edges.push({from: m.name, to, column: c.name, field: t.relationships.arguments.field});
}

const marts = models.filter((m) => m.group.startsWith("marts")).map((m) => ({
  name: m.name,
  description: grain(m.description),
  columns: (m.columns ?? []).map((c) => ({
    name: c.name,
    pk: testsOf(c.data_tests).includes("unique"),
    fk: edges.some((e) => e.from === m.name && e.column === c.name)
  }))
}));
const martNames = new Set(marts.map((m) => m.name));

const intermediate = models.filter((m) => m.group.startsWith("intermediate")).map((m) => ({
  name: m.name,
  group: m.group.split("/").slice(1).join("/"),
  description: grain(m.description)
}));

const countTests = (node) => {
  if (Array.isArray(node)) return node.reduce((n, x) => n + countTests(x), 0);
  if (node && typeof node === "object") return Object.entries(node).reduce((n, [k, v]) => n + (k === "data_tests" || k === "tests" ? (v?.length ?? 0) : 0) + countTests(v), 0);
  return 0;
};
const yamlTests = parse("models", ".yml").reduce((n, {doc}) => n + countTests(doc), 0);
const singularTests = readdirSync(join(dbt, "tests")).filter((f) => f.endsWith(".sql")).length;

const salesforce = sources.find((s) => s.name === "salesforce");
const tables = (salesforce?.tables ?? []).map((t) => ({
  name: t.name,
  description: grain(t.description),
  columns: (t.columns ?? []).map((c) => c.name)
}));

process.stdout.write(JSON.stringify({
  tables,
  tableEdges: [
    ["opportunities", "accounts", "AccountId"],
    ["opportunities", "campaigns", "CampaignId"],
    ["opportunities", "users", "OwnerId"],
    ["contacts", "accounts", "AccountId"],
    ["campaign_members", "campaigns", "CampaignId"],
    ["campaign_members", "leads", "LeadId"],
    ["campaign_members", "contacts", "ContactId"],
    ["leads", "contacts", "ConvertedContactId"],
    ["leads", "accounts", "ConvertedAccountId"],
    ["leads", "opportunities", "ConvertedOpportunityId"],
    ["opportunity_contact_roles", "opportunities", "OpportunityId"],
    ["opportunity_contact_roles", "contacts", "ContactId"],
    ["opportunity_history", "opportunities", "OpportunityId"]
  ].map(([from, to, column]) => ({from, to, column})),
  intermediate,
  marts,
  martEdges: edges.filter((e) => martNames.has(e.from) && martNames.has(e.to)),
  tests: {yaml: yamlTests, singular: singularTests}
}));
