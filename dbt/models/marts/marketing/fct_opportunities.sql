with opportunities as (
    select
        opportunity_id,
        account_id,
        owner_user_id,
        opportunity_name,
        stage_name,
        is_closed,
        is_won,
        amount,
        currency,
        created_at,
        created_at::date as created_on,
        close_on
    from {{ ref('int_opportunities__current') }}
),

rates as (
    select currency, rate_on, rate
    from {{ source('ecb', 'rates') }}
),

last_stage_change as (
    select opportunity_id, max(entered_at) as last_stage_change_at
    from {{ ref('int_opportunity_stage_history') }}
    group by opportunity_id
),

-- The latest delivery is the "today" of the data, so reruns on an old feed give the same flag.
as_of as (
    select max(delivered_on) as as_of_on
    from {{ ref('int_opportunities__current') }}
),

created_rate as (
    select o.opportunity_id, r.rate
    from opportunities o
    asof join rates r
        match_condition (o.created_on >= r.rate_on)
        on o.currency = r.currency
),

close_rate as (
    select o.opportunity_id, r.rate
    from opportunities o
    asof join rates r
        match_condition (o.close_on >= r.rate_on)
        on o.currency = r.currency
)

select
    o.opportunity_id,
    o.account_id,
    o.owner_user_id,
    o.opportunity_name,
    s.source_campaign_id,
    s.source_type,
    o.stage_name,
    o.is_closed,
    o.is_won,
    o.created_at,
    o.created_on,
    o.close_on,
    o.currency,
    o.amount,
    o.amount / iff(o.currency = 'EUR', 1, cr.rate) as amount_eur,
    iff(o.is_won, o.amount / iff(o.currency = 'EUR', 1, cl.rate), null) as won_amount_eur,
    coalesce(h.last_stage_change_at, o.created_at) as last_stage_change_at,
    not o.is_closed
        and datediff('day', coalesce(h.last_stage_change_at, o.created_at), a.as_of_on) > 30 as is_stalled
from opportunities o
join {{ ref('int_opportunity_source_campaign') }} s on o.opportunity_id = s.opportunity_id
left join created_rate cr on o.opportunity_id = cr.opportunity_id
left join close_rate cl on o.opportunity_id = cl.opportunity_id
left join last_stage_change h on o.opportunity_id = h.opportunity_id
cross join as_of a
