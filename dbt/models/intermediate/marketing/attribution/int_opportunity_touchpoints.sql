with roles as (
    select
        r.opportunity_id,
        r.opportunity_contact_role_id,
        r.contact_id,
        r.is_primary,
        p.email
    from {{ ref('int_opportunity_contact_roles__current') }} r
    join {{ ref('int_people') }} p on r.contact_id = p.contact_id
),

opportunity_touchpoints as (
    select
        o.opportunity_id,
        o.created_at::date as opportunity_created_on,
        r.opportunity_contact_role_id,
        r.contact_id,
        r.is_primary,
        t.email,
        t.campaign_member_id,
        t.campaign_id,
        t.touched_on,
        t.member_created_at
    from {{ ref('int_opportunities__current') }} o
    join roles r on o.opportunity_id = r.opportunity_id
    join {{ ref('int_touchpoints') }} t on r.email = t.email
    where t.touched_on <= o.created_at::date
),

numbered as (
    select
        *,
        row_number() over (
            partition by opportunity_id
            order by touched_on, member_created_at, campaign_member_id
        ) as touch_number,
        count(*) over (partition by opportunity_id) as touch_count
    from opportunity_touchpoints
)

select
    *,
    case
        when touch_number = 1 then 'first'
        when touch_number = touch_count then 'last'
        else 'middle'
    end as position,
    1::float / touch_count as linear_share
from numbered
