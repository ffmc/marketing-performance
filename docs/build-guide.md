# Build guide

The path from raw Salesforce extracts to a campaign pipeline dashboard, orchestrated with Airflow. It follows the same layering as `saas-revenue-analytics`: RAW as delivered, SILVER cleaned in Snowflake notebooks, dbt intermediate models and marts in GOLD.

Read `brief.md`, `metrics.md` and `source-data.md` first. They are the requirements.

---

## Phase 0 — Snowflake setup
Run `snowflake/setup.sql` (reuses the roles, warehouses and databases from the SaaS project and adds `RAW.SALESFORCE`).
**Done when:** `SHOW TABLES IN SCHEMA RAW.SALESFORCE` lists the 8 raw tables.

## Phase 1 — Salesforce simulator
Write `simulator/simulate.py` and `config.py`: deterministic daily JSONL extracts per object in `landing/salesforce/<object>/`, with every quirk in `source-data.md`, plus an answer key of pipeline by campaign and month for reconciliation.
**Done when:** a backfill from 2024-01-01 produces files for all 8 objects and the answer key.

## Phase 2 — Raw load
Write `ingestion/load.py` on the SaaS loader pattern (PUT to stage, COPY INTO, skip loaded files). Add ECB rates.
**Done when:** every raw table has rows and a second run loads nothing new.

## Phase 3 — Silver notebooks
`snowflake/notebooks/silver/silver.ipynb`: one typed, deduplicated table per object with full delivery history, the picklist rename handled and deleted records flagged. Check cells fail the run on null ids or unexpected statuses.

## Phase 4 — dbt project and sources
Declare every Silver table as a source with descriptions, `not_null`, `unique` and `accepted_values` tests, and freshness. Install `dbt_utils` and `dbt_expectations`.
**Done when:** `dbt test --select source:*` is green.

## Phase 5 — Intermediate models
Latest state per object, lead deduplication by email, lead-to-contact-to-opportunity stitching, source-campaign attribution, stage history with sort order.

## Phase 6 — Marts
`dim_campaigns`, `dim_accounts`, `fct_campaign_funnel`, `fct_opportunities`, `fct_opportunity_stage_history`, `mart_campaign_performance` (one row per campaign and month).

## Phase 7 — Data quality and tests
Generic and singular tests: funnel counts never increase down the stages, attributed pipeline sums to total pipeline, no opportunity attributed to two campaigns, reconciliation against the simulator's answer key, cost metrics only where cost exists.
**Done when:** a deliberately broken input makes `dbt build` fail.

## Phase 8 — Airflow orchestration
`airflow/dags/marketing_daily.py`: simulate, load, refresh Silver, `dbt build`, `dbt source freshness`, with retries and a failure alert. Run Airflow locally in Docker (Astro CLI or the official compose file).
**Done when:** three scheduled runs succeed without anyone touching them.

## Phase 9 — Documentation and dashboard
dbt docs with descriptions on every model and column, and a dashboard (Streamlit in Snowflake or Power BI) with one page per objective in the brief.

## Phase 10 — Showcase
README with the business problem, architecture diagram, lineage screenshot, design decisions and what's simulated. Add the project to `job-hunting/Context/Master.xlsx` and update the CV entry when it's done.
