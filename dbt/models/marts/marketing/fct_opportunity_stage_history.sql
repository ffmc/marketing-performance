with history as (
    select
        h.*,
        h.entered_at::date as entered_on,
        o.currency,
        o.account_id,
        o.owner_user_id
    from {{ ref('int_opportunity_stage_history') }} h
    join {{ ref('int_opportunities__current') }} o on h.opportunity_id = o.opportunity_id
),

rates as (
    select currency, rate_on, rate
    from {{ source('ecb', 'rates') }}
),

entered_rate as (
    select h.opportunity_history_id, r.rate
    from history h
    asof join rates r
        match_condition (h.entered_on >= r.rate_on)
        on h.currency = r.currency
)

select
    h.opportunity_history_id,
    h.opportunity_id,
    h.account_id,
    h.owner_user_id,
    s.source_campaign_id,
    h.stage_name,
    h.stage_sort_order,
    h.previous_stage_name,
    h.entered_at,
    h.entered_on,
    h.exited_at,
    h.days_in_stage,
    h.is_regression,
    h.is_current_stage,
    h.close_on,
    h.probability,
    h.currency,
    h.amount,
    h.amount / iff(h.currency = 'EUR', 1, r.rate) as amount_eur
from history h
join {{ ref('int_opportunity_source_campaign') }} s on h.opportunity_id = s.opportunity_id
left join entered_rate r on h.opportunity_history_id = r.opportunity_history_id
