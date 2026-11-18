# Setup

How to run the project on your own Snowflake account.

## Quickstart

**1. Python environment**
```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

**2. Key pairs for the service users** (skip if you already created them for saas-revenue-analytics)
```bash
mkdir -p keys
for u in loader dbt reporter; do
  openssl genrsa 2048 | openssl pkcs8 -topk8 -inform PEM -out keys/${u}_key.p8 -nocrypt
  openssl rsa -in keys/${u}_key.p8 -pubout -out keys/${u}_key.pub
done
```

**3. Snowflake.** Open `snowflake/setup.sql` in a Snowsight worksheet, replace the placeholders with your username and the three public keys (`keys/*.pub` without the BEGIN/END lines), and run it all. It's safe to run on the same account as saas-revenue-analytics.

**4. Generate and load data** (available after phases 1 and 2)
```bash
python simulator/simulate.py --backfill   # Salesforce files, Jan 2024 to yesterday
python ingestion/fx.py --backfill         # ECB exchange rates
cp .env.example .env                      # then fill in SNOWFLAKE_ACCOUNT
set -a; source .env; set +a
python ingestion/load.py
```

## Daily refresh
Airflow runs the whole chain once a day: simulate, load, refresh Silver, `dbt source freshness` and `dbt build`. When the build passes, it asks GitHub to rebuild the dashboard.

## Dashboard
The dashboard in `dashboard/` is an Observable Framework site. Its Python data loaders query the GOLD marts as `REPORTER_USER` at build time, so the published page never connects to Snowflake.

One-time setup:
1. Create `REPORTER_USER` with the block in `snowflake/setup.sql` (paste the contents of `keys/reporter_key.pub` without the BEGIN/END lines).
2. In the GitHub repo settings, set Pages > Source to "GitHub Actions" and add two secrets: `SNOWFLAKE_ACCOUNT` and `REPORTER_PRIVATE_KEY` (the full contents of `keys/reporter_key.p8`).
3. Create a fine-grained token for this repo with Contents: read and write, and put it in `.env` as `GITHUB_DISPATCH_TOKEN`. Restart the Airflow containers so they pick it up.

Run it locally from `dashboard/`:
```bash
npm ci
DASHBOARD_PYTHON=../.venv/bin/python DASHBOARD_PRIVATE_KEY_PATH=../keys/reporter_key.p8 SNOWFLAKE_ACCOUNT=<account> npm run dev
```
The workflow `.github/workflows/dashboard.yml` can also be started by hand from the Actions tab.

Every successful Snowflake pull is saved to `dashboard/snapshots/`, which is committed. If Snowflake can't be reached, the loaders serve the snapshot instead, so the page always has data locally; the "Data to" date in the header then shows how old it is. The workflow sets `DASHBOARD_REQUIRE_LIVE=1`, so a failed pull fails the build and the published page keeps its last good version. Commit the updated snapshots after a live run to keep the fallback current.
