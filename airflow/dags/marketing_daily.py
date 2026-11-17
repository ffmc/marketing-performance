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
    simulate = BashOperator(
        task_id="simulate",
        bash_command=f"{PIPELINE_PYTHON} simulator/simulate.py --until {{{{ ds }}}}",
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

    @task.external_python(task_id="refresh_silver", python=PIPELINE_PYTHON)
    def refresh_silver():
        import os

        import snowflake.connector

        notebook = "SILVER.PUBLIC.SILVER_REFRESH"
        with snowflake.connector.connect(
            account=os.environ["SNOWFLAKE_ACCOUNT"],
            user="DBT_USER",
            authenticator="SNOWFLAKE_JWT",
            private_key_file=os.environ["DBT_PRIVATE_KEY_PATH"],
            role="TRANSFORMER",
            warehouse="TRANSFORMING_WH",
        ) as con:
            cur = con.cursor()
            cur.execute("ALTER GIT REPOSITORY SILVER.PUBLIC.MARKETING_PERFORMANCE FETCH")
            cur.execute(
                f"CREATE OR REPLACE NOTEBOOK {notebook} "
                "FROM '@SILVER.PUBLIC.MARKETING_PERFORMANCE/branches/main/snowflake/notebooks/silver/' "
                "MAIN_FILE = 'silver.ipynb' QUERY_WAREHOUSE = TRANSFORMING_WH"
            )
            cur.execute(f"ALTER NOTEBOOK {notebook} ADD LIVE VERSION FROM LAST")
            cur.execute(f"EXECUTE NOTEBOOK {notebook}()")

    source_freshness = BashOperator(
        task_id="dbt_source_freshness",
        bash_command=f"{DBT} deps && {os.environ['DBT_BIN']} source freshness",
    )

    # dbt build exits non-zero on any failed test, so a broken test stops the run before the marts are replaced.
    dbt_build = BashOperator(
        task_id="dbt_build",
        bash_command=f"{DBT} build",
    )

    [simulate, fx] >> load >> refresh_silver() >> source_freshness >> dbt_build
