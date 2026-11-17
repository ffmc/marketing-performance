import csv
import os
import sys
from decimal import Decimal

import snowflake.connector

SCHEMA = os.environ.get("DASHBOARD_SCHEMA", "GOLD.MARKETING")


def connect():
    return snowflake.connector.connect(
        account=os.environ["SNOWFLAKE_ACCOUNT"],
        user=os.environ.get("DASHBOARD_SNOWFLAKE_USER", "REPORTER_USER"),
        authenticator="SNOWFLAKE_JWT",
        private_key_file=os.environ["DASHBOARD_PRIVATE_KEY_PATH"],
        role=os.environ.get("DASHBOARD_ROLE", "REPORTER"),
        warehouse=os.environ.get("DASHBOARD_WAREHOUSE", "REPORTING_WH"),
    )


def write_csv(sql):
    with connect() as con:
        cur = con.cursor()
        cur.execute(sql.format(schema=SCHEMA))
        out = csv.writer(sys.stdout, lineterminator="\n")
        out.writerow([c[0].lower() for c in cur.description])
        for row in cur:
            out.writerow(["" if v is None else round(v, 2) if isinstance(v, (float, Decimal)) else v for v in row])
