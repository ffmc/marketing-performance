with lead_to_person as (
    select
        f.value::string as lead_id,
        p.email
    from {{ ref('int_people') }} p,
        lateral flatten(input => p.lead_ids) f
),

responses as (
    select
        m.campaign_member_id,
        m.campaign_id,
        coalesce(lp.email, cp.email) as email,
        coalesce(m.first_responded_on, m.created_at::date) as touched_on,
        m.created_at as member_created_at
    from {{ ref('int_campaign_members__current') }} m
    left join lead_to_person lp on m.lead_id = lp.lead_id
    left join {{ ref('int_people') }} cp on m.contact_id = cp.contact_id
    where m.has_responded
)

select *
from responses
qualify row_number() over (
    partition by email, campaign_id
    order by touched_on, member_created_at, campaign_member_id
) = 1
