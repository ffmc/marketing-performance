import json
import os
import sys
from datetime import datetime, timezone

from _snowflake import SCHEMA, connect

with connect() as con:
    cur = con.cursor()
    cur.execute(f"""
        select greatest(
            (select max(created_on) from {SCHEMA}.fct_opportunities),
            (select max(entered_on) from {SCHEMA}.fct_opportunity_stage_history)
        )
    """)
    as_of = cur.fetchone()[0]

passed, total = os.environ.get("DBT_TESTS_PASSED"), os.environ.get("DBT_TESTS_TOTAL")
json.dump({
    "as_of": as_of.isoformat(),
    "built_at": datetime.now(timezone.utc).isoformat(timespec="minutes"),
    "tests": {"passed": int(passed), "total": int(total)} if passed and total else None,
}, sys.stdout)
