with touchpoints as (
    select
        t.opportunity_id,
        t.campaign_id,
        t.campaign_member_id,
        t.email,
        t.contact_id,
        t.touched_on,
        t.touch_number,
        t.touch_count,
        t.position,
        false as is_fallback,
        iff(t.touch_number = t.touch_count, 1, 0) as last_touch_share,
        t.linear_share
    from {{ ref('int_opportunity_touchpoints') }} t
),

first_touch_row as (
    select t.opportunity_id, min(t.touch_number) as touch_number
    from touchpoints t
    join {{ ref('int_opportunity_source_campaign') }} s
        on t.opportunity_id = s.opportunity_id and t.campaign_id = s.source_campaign_id
    group by t.opportunity_id
),

touchpoint_credit as (
    select
        t.*,
        iff(f.touch_number is not null, 1, 0) as first_touch_share
    from touchpoints t
    left join first_touch_row f
        on t.opportunity_id = f.opportunity_id and t.touch_number = f.touch_number
),

-- No touchpoints: every model falls back to the source campaign (Opportunity.CampaignId, then Unattributed).
-- Touchpoints but no primary contact: first touch goes to that fallback, which isn't one of the touchpoints.
fallback_credit as (
    select
        s.opportunity_id,
        s.source_campaign_id as campaign_id,
        null as campaign_member_id,
        null as email,
        null as contact_id,
        null as touched_on,
        null as touch_number,
        null as touch_count,
        null as position,
        true as is_fallback,
        iff(has_touchpoints.opportunity_id is null, 1, 0) as last_touch_share,
        iff(has_touchpoints.opportunity_id is null, 1, 0) as linear_share,
        1 as first_touch_share
    from {{ ref('int_opportunity_source_campaign') }} s
    left join (select distinct opportunity_id from touchpoints) has_touchpoints
        on s.opportunity_id = has_touchpoints.opportunity_id
    left join first_touch_row f on s.opportunity_id = f.opportunity_id
    where f.opportunity_id is null
),

credit as (
    select * from touchpoint_credit
    union all
    select * from fallback_credit
)

select
    c.opportunity_id,
    c.campaign_id,
    c.campaign_member_id,
    c.email,
    c.contact_id,
    c.touched_on,
    c.touch_number,
    c.touch_count,
    c.position,
    c.is_fallback,
    o.created_on as opportunity_created_on,
    o.close_on,
    o.is_won,
    o.currency,
    o.amount,
    o.amount_eur,
    o.won_amount_eur,
    c.first_touch_share,
    c.last_touch_share,
    c.linear_share,
    c.first_touch_share * o.amount_eur as first_touch_credit_eur,
    c.last_touch_share * o.amount_eur as last_touch_credit_eur,
    c.linear_share * o.amount_eur as linear_credit_eur
from credit c
join {{ ref('fct_opportunities') }} o on c.opportunity_id = o.opportunity_id
