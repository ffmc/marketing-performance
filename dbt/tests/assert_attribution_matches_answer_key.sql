{{ config(store_failures = true) }}

-- Compared in original currency: comparing in EUR would test the FX join, not attribution.
with answer_key as (
    select campaign_id, month, model, currency, pipeline_created, won_revenue, opportunities
    from {{ source('ground_truth', 'campaign_pipeline_monthly') }}
),

mart as (
    select campaign_id, month, model, currency, pipeline_created, won_revenue, opportunities
    from {{ ref('mart_campaign_attribution') }}
)

select
    campaign_id,
    month,
    model,
    currency,
    a.pipeline_created as expected_pipeline,
    m.pipeline_created as mart_pipeline,
    a.won_revenue as expected_won,
    m.won_revenue as mart_won,
    a.opportunities as expected_opportunities,
    m.opportunities as mart_opportunities
from answer_key a
full outer join mart m using (campaign_id, month, model, currency)
where abs(coalesce(a.pipeline_created, 0) - coalesce(m.pipeline_created, 0)) > 0.01
    or abs(coalesce(a.won_revenue, 0) - coalesce(m.won_revenue, 0)) > 0.01
    or abs(coalesce(a.opportunities, 0) - coalesce(m.opportunities, 0)) > 0.0001
