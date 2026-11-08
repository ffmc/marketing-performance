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

## Daily refresh
Airflow runs the whole chain once a day: simulate, load, refresh Silver, `dbt build` and `dbt source freshness` (available after phase 8).
