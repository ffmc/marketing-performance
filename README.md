# Fieldnote marketing performance

Fieldnote's marketing team reports leads, Sales reports pipeline, and nobody can say which campaigns produce deals that close. This project ingests Salesforce data into Snowflake, cleans and tests it with dbt, and orchestrates the daily refresh with Airflow, so every campaign can be followed from first touch to won revenue with one set of numbers.

**Status: in progress.** The requirements, metric definitions, source data spec, build plan and Snowflake setup are written. The Salesforce simulator, raw load, dbt models, data quality tests, Airflow DAG and dashboard are next (see the [build guide](docs/build-guide.md)). It's the companion to [saas-revenue-analytics](https://github.com/ffmc/saas-revenue-analytics), for the same fictional company.

## What it answers
The CMO's [brief](docs/brief.md) asks for:

1. A funnel per campaign, from members to leads, MQLs, SQLs, opportunities and won deals, with conversion between each step.
2. Pipeline created and won revenue in EUR by campaign, channel, country and month.
3. Cost per lead, per MQL and per opportunity, and pipeline-to-spend for every campaign with a budget.
4. Velocity from lead to MQL to opportunity to close, and time spent in each stage.
5. Open pipeline by stage, stalled opportunities and stage regressions.
6. A daily refresh nobody has to run by hand, with data quality tests that stop bad data before it reaches a report.

Every metric has one written definition in [metrics.md](docs/metrics.md), and nothing goes on a dashboard without one.

## How it's built

```
Salesforce simulator ─┐
ECB exchange rates ───┴─> Snowflake RAW ─> SILVER (notebooks) ─> dbt intermediate + marts (GOLD) ─> dashboard
                    └──────────────── orchestrated daily by Airflow ────────────────┘
```

**Stack:** Snowflake, dbt, Airflow, SQL, Python, Snowflake notebooks.

The parts worth a look:

- **Salesforce data with real problems.** The simulated objects (campaigns, campaign members, leads, contacts, accounts, opportunities, stage history) come with duplicate leads, lead conversions that split one person's history across objects, people in several campaigns, stage regressions and missing campaign costs. They're listed in [source-data.md](docs/source-data.md).
- **Pipeline counted once.** Each lead and opportunity is attributed to a single source campaign, and a test checks that campaign pipeline adds up to the company total.
- **Data quality as a gate.** dbt tests on sources and models, plus reconciliation against the simulator's answer key, fail the Airflow run before bad data reaches a report.

## Repo map

| Folder | What's in it |
|---|---|
| `simulator/` | Deterministic Salesforce data generator |
| `ingestion/` | Snowflake loader |
| `snowflake/` | Account setup (`setup.sql`) and the Silver notebook |
| `dbt/` | dbt project: sources, intermediate models and marts |
| `airflow/` | The daily DAG |
| `docs/` | [Brief](docs/brief.md), [metric definitions](docs/metrics.md), [source data](docs/source-data.md), [build guide](docs/build-guide.md) |

Salesforce data is simulated. Exchange rates are real, from the ECB.

## Run it yourself

### Quickstart

**1. Python environment**
```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

**2. Key pairs for the service users** (skip if you already created them for saas-revenue-analytics)
```bash
mkdir -p keys
for u in loader dbt; do
  openssl genrsa 2048 | openssl pkcs8 -topk8 -inform PEM -out keys/${u}_key.p8 -nocrypt
  openssl rsa -in keys/${u}_key.p8 -pubout -out keys/${u}_key.pub
done
```

**3. Snowflake.** Open `snowflake/setup.sql` in a Snowsight worksheet, replace the placeholders with your username and the two public keys (`keys/*.pub` without the BEGIN/END lines), and run it all. It's safe to run on the same account as saas-revenue-analytics.

**4. Generate and load data** (available after phases 1 and 2)
```bash
python simulator/simulate.py --backfill   # Salesforce files, Jan 2024 to yesterday
cp .env.example .env                      # then fill in SNOWFLAKE_ACCOUNT
set -a; source .env; set +a
python ingestion/load.py
```

### Daily refresh
Airflow runs the whole chain once a day: simulate, load, refresh Silver, `dbt build` and `dbt source freshness` (available after phase 8).
