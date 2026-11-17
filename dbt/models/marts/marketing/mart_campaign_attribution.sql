with credit as (
    select *, 'first_touch' as model, first_touch_share as share from {{ ref('fct_touchpoints') }} where first_touch_share > 0
    union all
    select *, 'last_touch' as model, last_touch_share as share from {{ ref('fct_touchpoints') }} where last_touch_share > 0
    union all
    select *, 'linear' as model, linear_share as share from {{ ref('fct_touchpoints') }} where linear_share > 0
),

pipeline as (
    select
        campaign_id,
        date_trunc('month', opportunity_created_on)::date as month,
        model,
        currency,
        sum(share * amount) as pipeline_created,
        sum(share * amount_eur) as pipeline_created_eur,
        sum(share) as opportunities
    from credit
    group by 1, 2, 3, 4
),

won as (
    select
        campaign_id,
        date_trunc('month', close_on)::date as month,
        model,
        currency,
        sum(share * amount) as won_revenue,
        sum(share * won_amount_eur) as won_revenue_eur
    from credit
    where is_won
    group by 1, 2, 3, 4
),

-- Influenced pipeline counts each opportunity once per campaign that touched it, so it doesn't add up across campaigns.
influenced_opportunities as (
    select distinct
        campaign_id,
        opportunity_id,
        date_trunc('month', opportunity_created_on)::date as month,
        currency,
        amount,
        amount_eur,
        touch_count
    from {{ ref('fct_touchpoints') }}
    where not is_fallback
),

influenced as (
    select
        campaign_id,
        month,
        currency,
        count(*) as influenced_opportunities,
        sum(amount) as influenced_pipeline,
        sum(amount_eur) as influenced_pipeline_eur,
        sum(touch_count) as total_touches
    from influenced_opportunities
    group by 1, 2, 3
),

keys as (
    select campaign_id, month, currency from pipeline
    union select campaign_id, month, currency from won
    union select campaign_id, month, currency from influenced
),

spine as (
    select k.*, m.model
    from keys k
    cross join (select column1 as model from values ('first_touch'), ('last_touch'), ('linear')) m
)

select
    s.campaign_id,
    s.month,
    s.model,
    s.currency,
    coalesce(p.pipeline_created, 0) as pipeline_created,
    coalesce(p.pipeline_created_eur, 0) as pipeline_created_eur,
    coalesce(w.won_revenue, 0) as won_revenue,
    coalesce(w.won_revenue_eur, 0) as won_revenue_eur,
    coalesce(p.opportunities, 0) as opportunities,
    coalesce(i.influenced_opportunities, 0) as influenced_opportunities,
    coalesce(i.influenced_pipeline, 0) as influenced_pipeline,
    coalesce(i.influenced_pipeline_eur, 0) as influenced_pipeline_eur,
    coalesce(i.total_touches, 0) as total_touches,
    i.total_touches / nullif(i.influenced_opportunities, 0) as touches_per_opportunity
from spine s
left join pipeline p
    on s.campaign_id = p.campaign_id and s.month = p.month and s.model = p.model and s.currency = p.currency
left join won w
    on s.campaign_id = w.campaign_id and s.month = w.month and s.model = w.model and s.currency = w.currency
left join influenced i
    on s.campaign_id = i.campaign_id and s.month = i.month and s.currency = i.currency
