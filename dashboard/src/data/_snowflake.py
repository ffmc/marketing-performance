import csv
import io
import os
import sys
from decimal import Decimal
from pathlib import Path

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


def serve(produce):
    snap = Path(__file__).resolve().parents[2] / "snapshots" / Path(sys.argv[0]).stem
    try:
        text = produce()
    except Exception as e:
        if os.environ.get("DASHBOARD_REQUIRE_LIVE") or not snap.exists():
            raise
        print(f"Snowflake unavailable ({type(e).__name__}); serving snapshot {snap.name}", file=sys.stderr)
        text = snap.read_text()
    else:
        snap.parent.mkdir(exist_ok=True)
        snap.write_text(text)
    sys.stdout.write(text)


def write_csv(sql):
    def produce():
        buf = io.StringIO()
        with connect() as con:
            cur = con.cursor()
            cur.execute(sql.format(schema=SCHEMA))
            out = csv.writer(buf, lineterminator="\n")
            out.writerow([c[0].lower() for c in cur.description])
            for row in cur:
                out.writerow(["" if v is None else round(v, 2) if isinstance(v, (float, Decimal)) else v for v in row])
        return buf.getvalue()

    serve(produce)
