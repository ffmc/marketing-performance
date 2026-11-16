with lead_to_person as (
    select
        f.value::string as lead_id,
        p.email
    from {{ ref('int_people') }} p,
        lateral flatten(input => p.lead_ids) f
),

memberships as (
    select
        m.campaign_member_id,
        m.campaign_id,
        coalesce(lp.email, cp.email) as email,
        m.created_at
    from {{ ref('int_campaign_members__current') }} m
    left join lead_to_person lp on m.lead_id = lp.lead_id
    left join {{ ref('int_people') }} cp on m.contact_id = cp.contact_id
),

first_touchpoint as (
    select email, campaign_id, touched_on
    from {{ ref('int_touchpoints') }}
    qualify row_number() over (
        partition by email
        order by touched_on, member_created_at, campaign_member_id
    ) = 1
),

first_membership as (
    select email, campaign_id, created_at
    from memberships
    where email is not null
    qualify row_number() over (
        partition by email
        order by created_at, campaign_member_id
    ) = 1
)

select
    p.email,
    coalesce(t.campaign_id, m.campaign_id) as source_campaign_id,
    case
        when t.campaign_id is not null then 'touchpoint'
        when m.campaign_id is not null then 'membership'
    end as source_type,
    coalesce(t.touched_on, m.created_at::date) as source_on
from {{ ref('int_people') }} p
left join first_touchpoint t on p.email = t.email
left join first_membership m on p.email = m.email
