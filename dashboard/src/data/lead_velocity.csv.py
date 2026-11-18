from _snowflake import write_csv

# Only people who reached MQL; email stays in Snowflake.
write_csv("""
    select
        campaign_id,
        lead_on,
        mql_at::date as mql_on,
        opportunity_on
    from {schema}.fct_campaign_funnel
    where mql_at is not null
""")
