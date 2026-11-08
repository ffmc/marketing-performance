# Build guide

The path from raw Salesforce extracts to a campaign pipeline dashboard, orchestrated with Airflow. Phases 0–2 are done for you; from phase 3 on, you build. Each phase lists what to learn first, the tasks, the traps, a check you can run, and what you'll say about it in an interview.

It follows the same layering as `saas-revenue-analytics`: RAW as delivered, SILVER cleaned in Snowflake notebooks, dbt intermediate models and marts in GOLD. Read `brief.md`, `metrics.md` and `source-data.md` before phase 3. They are the requirements, and I'm the CMO who wrote them: bring questions about definitions to me before you model them.

---

## Phase 0 — Snowflake setup (done for you, 30 min to run)
**Goal:** the Salesforce, ECB and answer-key tables exist in RAW, with the same roles and warehouses as the SaaS project.

**Tasks**
1. Run `snowflake/setup.sql` in a Snowsight worksheet (`docs/setup.md` has the steps). Every object uses `IF NOT EXISTS`, so it's safe on the SaaS account.
2. Read the new blocks: `RAW.SALESFORCE`, the contact roles table and `RAW.GROUND_TRUTH.CAMPAIGN_PIPELINE_MONTHLY`.

**Done when:** `SHOW TABLES IN SCHEMA RAW.SALESFORCE` lists the 9 raw tables.

**Interview talking point:** "Both projects share one account with three roles and three warehouses, so loading, transforming and reporting are separated and costed on their own. A resource monitor caps credits for the whole portfolio."

## Phase 1 — Salesforce simulator (done for you)
**Goal:** deterministic daily Salesforce extracts with every quirk in `source-data.md`, plus an answer key.

**Tasks**
1. Run `python simulator/simulate.py --backfill` and open a few files in `landing/salesforce/`. Pick one lead `Id` and follow it through `leads/`, `campaign_members/` and, if it converted, `contacts/` and `opportunities/`.
2. Open `landing/ground_truth/campaign_pipeline_monthly.csv`: pipeline by campaign, month, currency and attribution model. Read `answer_key()` in `simulate.py` next to the Touchpoints section of `metrics.md`.

**Done when:** you can explain why the same lead appears in several daily files.

**Interview talking point:** "The source is simulated but follows the Salesforce API shape, and it computes its own answer key from the metric definitions. That gives me a reconciliation test that would catch a wrong join, which tests on the models alone can't."

## Phase 2 — Raw load (done for you, 15 min to run)
**Goal:** every raw table populated, re-runs load nothing new.

**Tasks:** follow the quickstart in `docs/setup.md`: simulator backfill, `python ingestion/fx.py --backfill`, then `python ingestion/load.py`. In Snowsight, run `SELECT RAW FROM RAW.SALESFORCE.OPPORTUNITIES LIMIT 20` and click into the JSON.

**Done when:** every table in `RAW.SALESFORCE` has rows and a second `load.py` run reports 0 rows loaded.

**Interview talking point:** "Raw lands as VARIANT exactly as delivered, with file name and row number. COPY INTO skips files it already loaded, so the daily run is safe to repeat."

---

## Phase 3 — Silver notebooks (week 1, ~8 h)
**Goal:** one typed, deduplicated table per Salesforce object in `SILVER.SALESFORCE`, plus `SILVER.ECB.RATES`. Full delivery history, no business logic.

**Learn first**
- Snowflake semi-structured data: `:` path syntax and `::` casts: https://docs.snowflake.com/en/user-guide/querying-semistructured
- Salesforce object reference for Lead, CampaignMember and Opportunity: https://developer.salesforce.com/docs/atlas.en-us.object_reference.meta/object_reference/
- SQL drills: `ROW_NUMBER`, `QUALIFY`, dedup.

**Tasks**
1. One notebook, `snowflake/notebooks/silver/silver.ipynb`, with a section per object: `CREATE OR REPLACE TABLE SILVER.SALESFORCE.<OBJECT>` from RAW, followed by a check cell.
2. Keep one row per record per delivery, with `delivered_on` parsed from `_FILE`. Remove exact duplicates on (`Id`, `delivered_on`).
3. Cast every field to its type: timestamps to `TIMESTAMP_TZ`, dates to `DATE`, amounts and costs to `NUMBER(18,2)`, booleans to `BOOLEAN`. Use snake_case column names.
4. Map the picklist rename: a `lead_status` column where `Working` becomes `Contacted`, and keep the original as `lead_status_raw`.
5. Keep `is_deleted` as a column. Don't filter deleted records in Silver.
6. `SILVER.ECB.RATES`: one row per currency and date, deduplicated across overlapping files.
7. Check cells that fail the run: ids not null, `lead_status` and `stage_name` in the expected set, currencies in EUR/GBP/USD, no duplicates on the dedup grain.

**Traps**
- Order history by `delivered_on` then `_FILE_ROW`, never by `_LOADED_AT`.
- `OPPORTUNITY_HISTORY` is append-only, not re-delivered state. Its grain is the history `Id`, not `Id` + delivery.
- `FirstRespondedDate` is a date and `CreatedDate` a timestamp. Don't cast them to the same type and lose the time.
- `CampaignMember.ContactId` gets filled in when the lead converts, so the same member has a NULL and then a non-NULL `ContactId` across deliveries.

**Done when:** the notebook runs top to bottom with no failed checks, and `SELECT COUNT(DISTINCT lead_status) FROM SILVER.SALESFORCE.LEADS` doesn't include `Working`.

**Interview talking point:** "Silver keeps the full delivery history because Salesforce re-sends the whole record on every change. Choosing the current state is a modeling decision, so it happens in dbt, where it's tested."

## Phase 4 — dbt project and sources (week 2, ~4 h)
**Goal:** every Silver table declared as a dbt source, documented and tested.

**Learn first**
- Sources and freshness: https://docs.getdbt.com/docs/build/sources
- Data tests: https://docs.getdbt.com/docs/build/data-tests
- `dbt_expectations`: https://hub.getdbt.com/metaplane/dbt_expectations/latest/

**Tasks**
1. `profiles.yml` with `dev` (your user, role TRANSFORMER, database GOLD, schema `DBT_<YOU>`) and `ci` (DBT_USER, key-pair auth, schema CI). Keep it out of git.
2. `models/sources/_salesforce__sources.yml` and `_ecb__sources.yml`, with descriptions copied from `source-data.md`.
3. Tests: `not_null` on ids, `unique` on the dedup grain, `accepted_values` on statuses, stages, campaign types and currencies.
4. Freshness on `delivered_on` (warn after 1 day, error after 2).
5. Add `dbt_expectations` to `packages.yml` and run `dbt deps`.

**Traps**
- Snowflake uppercases unquoted identifiers. Write names in lowercase in YAML.
- A unique test on `Id` alone fails in Silver by design. The grain is `Id` + `delivered_on`.

**Done when:** `dbt debug` passes and `dbt test --select source:*` is green.

**Interview talking point:** "The sources document the quirks of the feed, like the picklist rename and conversions, so the next person knows about them before writing a join."

## Phase 5 — Intermediate models (weeks 3–4, ~12 h)
**Goal:** current state of every record, one row per person, and every touchpoint, ready for the marts.

**Learn first**
- dbt intermediate models: https://docs.getdbt.com/best-practices/how-we-structure/3-intermediate
- SQL drills: window functions over partitions, `QUALIFY`, `LAG`, self-joins.
- The Attribution and Touchpoints sections of `metrics.md`, line by line.

**Tasks**
1. `int_<object>__current`: latest delivery per `Id`, excluding `is_deleted`, for campaigns, members, leads, contacts, accounts, opportunities and contact roles.
2. `int_lead_status_history`: one row per lead and status change, with the first date each lead reached MQL and SQL.
3. `int_people`: one row per person (lowercase email), linking duplicate leads, the converted contact, account and opportunity.
4. `int_touchpoints`: one row per person and campaign with `HasResponded`, dated by `FirstRespondedDate` or the member's `CreatedDate`, earliest response kept.
5. `int_opportunity_touchpoints`: touchpoints of every contact role on each opportunity, on or before its creation date, with a position (first, middle, last) and the linear share.
6. `int_source_campaign`: one source campaign per person and per opportunity, following the fallback order in `metrics.md`.
7. `int_opportunity_stage_history`: history with stage sort order, previous stage, days in stage and a regression flag.

**Traps**
- A member links to a lead before conversion and to a lead *and* a contact after. Resolve the person by email, not by whichever id is filled.
- Two duplicate leads can respond to the same campaign: one touchpoint, not two. Otherwise linear credit gives that campaign double weight.
- Touches after the opportunity's creation date look like good engagement but must not get credit.
- An opportunity can have no primary role but an influencer role. Read the fallback rules again before you assume first touch and last touch use the same contacts.

**Done when:** for every opportunity, the sum of linear shares in `int_opportunity_touchpoints` is exactly 1, or the opportunity has no touchpoints.

**Interview talking point:** "The hardest part was identity: a person is a lead, sometimes a duplicate lead, then a contact. Once I resolved people by email, attribution became a join instead of a set of special cases."

## Phase 6 — Marts (week 5, ~8 h)
**Goal:** the tables behind every page of the brief, in EUR.

**Learn first**
- dbt marts: https://docs.getdbt.com/best-practices/how-we-structure/4-marts
- Kimball facts and dimensions, grain first.
- The Revenue, Cost and Velocity sections of `metrics.md`.

**Tasks**
1. `dim_campaigns` (with cost and a `has_cost` flag) and `dim_accounts`.
2. `fct_opportunities`: current state, amount in original currency and EUR, source campaign, stalled flag.
3. `fct_opportunity_stage_history` from the intermediate model.
4. `fct_campaign_funnel`: one row per campaign and person with the date of each funnel stage reached.
5. `fct_touchpoints`: one row per opportunity touchpoint with first-touch, last-touch and linear credit in EUR.
6. `mart_campaign_performance`: one row per campaign and month with funnel counts, pipeline, won revenue, cost metrics and velocity.
7. `mart_campaign_attribution`: one row per campaign, month and model, plus influenced pipeline and touches per opportunity.

**Traps**
- Convert with the ECB rate of the last business day on or before the date measured. Weekends and holidays have no rate.
- Cost metrics with no cost are NULL, not zero, and not divided by zero.
- Influenced pipeline doesn't add up across campaigns. Never put a total under it.

**Done when:** `dbt build --select marts` passes and the first-touch pipeline in `mart_campaign_attribution` for one month equals the sum of `fct_opportunities` created that month.

**Interview talking point:** "Every mart has one grain written in its description. Attribution has its own mart with the model as a column, so comparing first and last touch is a filter, not a new query."

## Phase 7 — Data quality and tests (week 6, ~5 h)
**Goal:** tests that stop the run before a wrong number reaches the dashboard.

**Learn first**
- Singular tests: https://docs.getdbt.com/docs/build/data-tests#singular-data-tests
- Test severity and `store_failures`.

**Tasks**
1. Funnel counts never increase down the stages, per campaign and month.
2. Every attribution model sums to total pipeline created and won revenue per month.
3. No opportunity has first-touch credit in two campaigns.
4. No touchpoint dated after its opportunity's creation gets credit.
5. Reconciliation: `mart_campaign_attribution` in original currency matches `RAW.GROUND_TRUTH.CAMPAIGN_PIPELINE_MONTHLY` per campaign, month, model and currency, within 0.01.
6. Cost metrics only where `has_cost` is true.
7. Break an input on purpose (for example, drop the email dedup) and watch `dbt build` fail.

**Traps**
- Compare to the answer key in original currency. Comparing in EUR tests the FX join, not attribution.
- Linear shares are fractions. Round only at the end.

**Done when:** a deliberately broken input makes `dbt build` fail, and the fixed version passes.

**Interview talking point:** "The reconciliation test compares my marts to an answer key computed independently from the same definitions. If duplicate leads double-count touches in linear attribution, the totals still add up but the reconciliation fails, so the bug never reaches the dashboard."

## Phase 8 — Airflow orchestration (week 7, ~6 h)
**Goal:** the whole refresh runs every day without anyone touching it.

**Learn first**
- Airflow DAGs, tasks and retries: https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/dags.html
- Running Airflow locally with Docker Compose: https://airflow.apache.org/docs/apache-airflow/stable/howto/docker-compose/index.html

**Tasks**
1. `airflow/dags/marketing_daily.py` with tasks: simulate, fx, load, refresh Silver, `dbt source freshness`, `dbt build`.
2. Run Silver with `EXECUTE NOTEBOOK` from a Snowflake operator or a Python task.
3. Retries (2, 5 minutes apart) and a failure callback that sends an alert.
4. Pass `{{ ds }}` to the simulator as `--until` so backfills and reruns are deterministic.

**Traps**
- Don't put the private keys in the image. Mount them and read paths from environment variables.
- `dbt build` must stop the run on a failed test. Don't set tests to warn to make the DAG green.

**Done when:** three scheduled runs succeed in a row, and a run with a broken test stops before the marts update.

**Interview talking point:** "The DAG treats tests as a gate: if reconciliation fails, the dashboard keeps yesterday's numbers instead of showing wrong ones."

## Phase 9 — Documentation and dashboard (week 8, ~8 h)
**Goal:** a dashboard with one page per objective in the brief, every metric defined in `metrics.md`.

**Learn first**
- Streamlit in Snowflake: https://docs.snowflake.com/en/developer-guide/streamlit/about-streamlit
- `dbt docs generate` and model descriptions.

**Tasks**
1. Descriptions on every model and column. Generate dbt docs and take a lineage screenshot.
2. Dashboard pages: funnel, pipeline by campaign and channel, cost efficiency, velocity, pipeline health, touchpoints.
3. On the touchpoints page, show first touch, last touch and linear side by side, and influenced pipeline on its own, labelled.
4. Every number on screen links or refers to its definition in `metrics.md`.

**Done when:** I (the CMO) can answer every question in the README from the dashboard without asking you.

**Interview talking point:** "The dashboard only shows metrics that are written down, so the budget meeting argues about decisions, not definitions."

## Phase 10 — Showcase (week 9, ~3 h)
**Goal:** a hiring manager understands the project in two minutes.

**Tasks**
1. README: business problem, architecture, lineage screenshot, design decisions and what's simulated.
2. A 2–3 minute demo video: one campaign that looks strong on first touch and weaker on last touch, and why.
3. Add the project to `job-hunting/Context/Master.xlsx`, then to the Analytics Engineer CV.

**Done when:** someone who hasn't seen it can explain what it does after reading the README.
