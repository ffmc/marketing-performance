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
The dashboard in `dashboard/` is an Observable Framework site. Its Python data loaders query the GOLD marts as `REPORTER_USER`, save every successful pull to `dashboard/snapshots/`, and serve that snapshot when Snowflake can't be reached. The published page is built from the committed snapshots, so GitHub Actions needs no Snowflake secrets and the page never connects to Snowflake.

The workflow `.github/workflows/dashboard.yml` deploys to GitHub Pages on every push to `main` that touches `dashboard/`, and can also be started by hand from the Actions tab. Pages > Source must be set to "GitHub Actions".

To refresh the data, create `REPORTER_USER` with the block in `snowflake/setup.sql` (paste the contents of `keys/reporter_key.pub` without the BEGIN/END lines), run the dashboard locally against Snowflake, and commit the updated snapshots:
```bash
cd dashboard
npm ci
DASHBOARD_PYTHON=../.venv/bin/python DASHBOARD_PRIVATE_KEY_PATH=../keys/reporter_key.p8 SNOWFLAKE_ACCOUNT=<account> npm run dev
```
