from _snowflake import write_csv

write_csv("""
    select
        o.opportunity_id,
        o.source_campaign_id as campaign_id,
        o.stage_name,
        iff(o.is_closed, 1, 0) as is_closed,
        iff(o.is_won, 1, 0) as is_won,
        o.created_on,
        o.close_on,
        o.amount_eur,
        o.won_amount_eur,
        o.last_stage_change_at::date as last_stage_change_on,
        iff(o.is_stalled, 1, 0) as is_stalled
    from {schema}.fct_opportunities o
""")
