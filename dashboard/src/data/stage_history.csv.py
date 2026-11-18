from _snowflake import write_csv

write_csv("""
    select
        opportunity_id,
        source_campaign_id as campaign_id,
        stage_name,
        previous_stage_name,
        entered_on,
        days_in_stage,
        iff(is_regression, 1, 0) as is_regression
    from {schema}.fct_opportunity_stage_history
""")
