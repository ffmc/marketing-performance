# Fieldnote marketing performance

A portfolio project that follows every marketing campaign at Fieldnote, a fictional team-planning software company, from the first person it reached to the revenue it closed. Marketing reports leads, Sales reports pipeline, and nobody can say which campaigns produce deals that close, so the goal is one set of numbers both teams use when deciding where the budget goes.

Salesforce data lands in Snowflake, dbt cleans, models and tests it, and Airflow runs the whole refresh every day.

**Status: in progress.** Done so far: the requirements, metric definitions, source data spec, build plan and Snowflake setup. Next: the Salesforce data simulator, raw load, dbt models, data quality tests, the Airflow schedule and the dashboard (see the [build guide](docs/build-guide.md)). It's the companion to [saas-revenue-analytics](https://github.com/ffmc/saas-revenue-analytics), for the same company.

## The business case

Fieldnote spends on webinars, paid search, events, content and partner campaigns across Spain, the UK and the US. Everything is in Salesforce, but every export gives a different answer: one person can sit in several campaigns, leads are created twice, a lead's history continues on a different record once it's converted, and deals move backwards through stages. Marketing counts leads, Sales counts pipeline, and the budget meeting turns into an argument about whose number is right.

The CMO's [brief](docs/brief.md) asks for a pipeline view by campaign that refreshes itself and that holds up in the budget meeting. It would count as a failure if pipeline were counted twice because a lead sat in two campaigns, if a conversion rate appeared on screen without a written definition, or if someone had to run the refresh by hand.

## Questions it answers

**Campaign funnel**
- For each campaign, how many people did it reach, and how many became leads, marketing-qualified leads, sales-qualified leads, opportunities and won deals?
- Where in the funnel does each campaign lose people?

**Pipeline and revenue**
- How much pipeline and won revenue did each campaign and channel create, by country and month, in euros?

**Spend**
- What does a lead, a qualified lead and an opportunity cost for each campaign?
- How much pipeline does each euro of campaign spend produce?

**Speed**
- How long does it take to go from lead to qualified lead, to opportunity, to a closed deal?
- In which sales stage do deals spend the most time?

**Pipeline health**
- How much pipeline is open at each stage?
- Which deals haven't moved in 30 days, and which went backwards?

Each of these metrics has one written definition in [metrics.md](docs/metrics.md), including the rule that gives every lead and deal to exactly one campaign.

## How it's built

```
Salesforce simulator ─┐
ECB exchange rates ───┴─> Snowflake RAW ─> SILVER (notebooks) ─> dbt intermediate + marts (GOLD) ─> dashboard
                    └──────────────── orchestrated daily by Airflow ────────────────┘
```

| Step | What happens | Tools |
|---|---|---|
| Source data | A simulator writes daily Salesforce extracts (campaigns, campaign members, leads, contacts, accounts, opportunities, stage history), and real exchange rates come from the European Central Bank | Python |
| Raw load | Files land in Snowflake exactly as delivered, with the file name and row kept for traceability | Snowflake, Python |
| Cleaning | One clean table per Salesforce object: correct types, duplicates removed, deleted records flagged, renamed picklist values aligned | Snowflake notebooks, SQL |
| Modeling | Latest state of each record, duplicate leads merged, leads linked to their contacts and deals, one source campaign per lead and deal, then the marts behind each question | dbt, SQL |
| Data quality | Tests on every source and model: funnel counts never grow down the stages, campaign pipeline adds up to the company total, no deal belongs to two campaigns, and totals match an answer key | dbt |
| Reporting | A dashboard with one page per question area | Streamlit in Snowflake or Power BI |
| Orchestration | A daily Airflow run loads, builds and tests everything, retries failed steps and alerts on failure | Airflow |

### Design decisions

- **Salesforce data with real problems.** The simulated data follows the shape of Salesforce API objects and includes duplicate leads, lead conversions, people in several campaigns, deals moving backwards and campaigns with missing costs. They're listed in [source-data.md](docs/source-data.md).
- **Pipeline counted once.** Each lead and deal is attributed to a single source campaign, and a test checks that campaign pipeline adds up to the company total.
- **Data quality as a gate.** If a test fails, the Airflow run stops before the bad data reaches a report.

## Repo map

| Folder | What's in it |
|---|---|
| `simulator/` | Salesforce data generator |
| `ingestion/` | Snowflake loader |
| `snowflake/` | Account setup (`setup.sql`) and the cleaning notebook |
| `dbt/` | dbt project: sources, intermediate models and marts |
| `airflow/` | The daily DAG |
| `docs/` | [Brief](docs/brief.md), [metric definitions](docs/metrics.md), [source data](docs/source-data.md), [build guide](docs/build-guide.md), [setup](docs/setup.md) |

Salesforce data is simulated. Exchange rates are real.

## Run it yourself

The setup steps and commands are in [docs/setup.md](docs/setup.md).
