import logging
import os
from datetime import timedelta

import pendulum
from airflow.providers.standard.operators.bash import BashOperator
from airflow.sdk import DAG, task
from airflow.timetables.interval import CronDataIntervalTimetable

log = logging.getLogger(__name__)

PROJECT_DIR = os.environ["PROJECT_DIR"]
PIPELINE_PYTHON = os.environ["PIPELINE_PYTHON"]
DBT = f"cd {PROJECT_DIR}/dbt && {os.environ['DBT_BIN']}"


def alert_on_failure(context):
    ti = context["ti"]
    log.error("ALERT: %s.%s failed for %s (try %s)", ti.dag_id, ti.task_id, context["ds"], ti.try_number)


with DAG(
    dag_id="marketing_daily",
    # Interval timetable: the 06:00 run covers the previous day, so {{ ds }} is the day being loaded.
    schedule=CronDataIntervalTimetable("0 6 * * *", timezone="UTC"),
    start_date=pendulum.datetime(2026, 11, 14, tz="UTC"),
    catchup=False,
    max_active_runs=1,
    default_args={
        "retries": 2,
        "retry_delay": timedelta(minutes=5),
        "on_failure_callback": alert_on_failure,
    },
    tags=["marketing"],
) as dag:
    # --resume also writes any days missed since the last run, so no record change is skipped.
    simulate = BashOperator(
        task_id="simulate",
        bash_command=f"{PIPELINE_PYTHON} simulator/simulate.py --until {{{{ ds }}}} --resume",
        cwd=PROJECT_DIR,
    )

    fx = BashOperator(
        task_id="fx",
        bash_command=f"{PIPELINE_PYTHON} ingestion/fx.py --until {{{{ ds }}}}",
        cwd=PROJECT_DIR,
    )

    load = BashOperator(
        task_id="load",
        bash_command=f"{PIPELINE_PYTHON} ingestion/load.py",
        cwd=PROJECT_DIR,
    )

    # The account no longer allows legacy notebook objects, so the notebook's SQL cells run here in order.
    # Its check cells cast 'CHECK FAILED' to int, which raises and fails the task.
    @task.external_python(task_id="refresh_silver", python=PIPELINE_PYTHON)
    def refresh_silver():
        import json
        import os

        import snowflake.connector

        notebook = os.path.join(os.environ["PROJECT_DIR"], "snowflake/notebooks/silver/silver.ipynb")
        with open(notebook) as f:
            cells = ["".join(c["source"]) for c in json.load(f)["cells"] if c["cell_type"] == "code"]

        with snowflake.connector.connect(
            account=os.environ["SNOWFLAKE_ACCOUNT"],
            user="DBT_USER",
            authenticator="SNOWFLAKE_JWT",
            private_key_file=os.environ["DBT_PRIVATE_KEY_PATH"],
            role="TRANSFORMER",
            warehouse="TRANSFORMING_WH",
        ) as con:
            for number, sql in enumerate(cells, start=1):
                print(f"Running cell {number}/{len(cells)}")
                con.execute_string(sql)

    source_freshness = BashOperator(
        task_id="dbt_source_freshness",
        bash_command=f"{DBT} deps && {os.environ['DBT_BIN']} source freshness",
    )

    # dbt build exits non-zero on any failed test, so a broken test stops the run before the marts are replaced.
    dbt_build = BashOperator(
        task_id="dbt_build",
        bash_command=f"{DBT} build",
    )

    # Runs only when dbt_build passed, so the public dashboard never shows numbers from a failed build.
    @task(task_id="trigger_dashboard_deploy")
    def trigger_dashboard_deploy():
        import json
        import urllib.request

        with open(os.path.join(os.environ["DBT_TARGET_PATH"], "run_results.json")) as f:
            results = json.load(f)["results"]
        tests = [r for r in results if r["unique_id"].startswith("test.")]
        payload = {
            "event_type": "dbt-success",
            "client_payload": {"tests_passed": sum(r["status"] == "pass" for r in tests), "tests_total": len(tests)},
        }
        request = urllib.request.Request(
            "https://api.github.com/repos/ffmc/marketing-performance/dispatches",
            data=json.dumps(payload).encode(),
            headers={
                "Authorization": f"Bearer {os.environ['GITHUB_DISPATCH_TOKEN']}",
                "Accept": "application/vnd.github+json",
            },
            method="POST",
        )
        urllib.request.urlopen(request).close()
        log.info("Dashboard deploy requested: %s", payload["client_payload"])

    [simulate, fx] >> load >> refresh_silver() >> source_freshness >> dbt_build >> trigger_dashboard_deploy()
