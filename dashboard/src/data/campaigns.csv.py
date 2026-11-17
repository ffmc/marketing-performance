from _snowflake import write_csv

write_csv("""
    select
        campaign_id,
        regexp_replace(campaign_name, '^[0-9]{{4}}-[0-9]{{2}} .* (ES|GB|US) - ', '') as topic,
        coalesce(campaign_type, 'Unattributed') as channel,
        campaign_country as country,
        start_on,
        end_on,
        cost_eur
    from {schema}.dim_campaigns
""")
