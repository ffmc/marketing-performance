from _snowflake import write_csv

write_csv("""
    select
        campaign_id,
        month,
        model,
        sum(pipeline_created_eur) as pipeline_created_eur,
        sum(won_revenue_eur) as won_revenue_eur,
        sum(opportunities) as opportunities,
        sum(influenced_opportunities) as influenced_opportunities,
        sum(influenced_pipeline_eur) as influenced_pipeline_eur
    from {schema}.mart_campaign_attribution
    group by 1, 2, 3
""")
