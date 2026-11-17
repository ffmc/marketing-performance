FROM docker.io/apache/airflow:3.4.0-python3.12

# dbt and the loaders get their own venv so their dependencies can't clash with Airflow's.
USER root
RUN python -m venv /opt/pipeline-venv \
    && /opt/pipeline-venv/bin/pip install --no-cache-dir dbt-core==1.12.6 dbt-snowflake==1.12.5 "snowflake-connector-python>=3.12"
USER airflow
