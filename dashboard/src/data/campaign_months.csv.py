from _snowflake import write_csv

write_csv("""
    select
        campaign_id, month, members, leads, mqls, sqls, opportunities, won_deals,
        pipeline_created_eur, won_revenue_eur, cost_eur
    from {schema}.mart_campaign_performance
""")
