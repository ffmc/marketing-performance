with lead_to_person as (
    select
        f.value::string as lead_id,
        p.email
    from {{ ref('int_people') }} p,
        lateral flatten(input => p.lead_ids) f
),

memberships as (
    select
        m.campaign_id,
        coalesce(lp.email, cp.email) as email,
        min(m.created_at) as member_at
    from {{ ref('int_campaign_members__current') }} m
    left join lead_to_person lp on m.lead_id = lp.lead_id
    left join {{ ref('int_people') }} cp on m.contact_id = cp.contact_id
    where coalesce(lp.email, cp.email) is not null
    group by 1, 2
),

milestones as (
    select
        lp.email,
        min(m.first_mql_at) as mql_at,
        min(m.first_sql_at) as sql_at
    from lead_to_person lp
    join {{ ref('int_lead_milestones') }} m on lp.lead_id = m.lead_id
    group by lp.email
),

primary_contact_opportunity as (
    select p.email, r.opportunity_id
    from {{ ref('int_opportunity_contact_roles__current') }} r
    join {{ ref('int_people') }} p on r.contact_id = p.contact_id
    join {{ ref('int_opportunities__current') }} o on r.opportunity_id = o.opportunity_id
    where r.is_primary
    qualify row_number() over (partition by p.email order by o.created_at, o.opportunity_id) = 1
),

person_opportunity as (
    select
        p.email,
        o.created_at::date as opportunity_on,
        iff(o.is_won, o.close_on, null) as won_on
    from {{ ref('int_people') }} p
    left join primary_contact_opportunity pc on p.email = pc.email
    join {{ ref('int_opportunities__current') }} o
        on o.opportunity_id = coalesce(p.converted_opportunity_id, pc.opportunity_id)
),

source_stages as (
    select
        s.email,
        s.source_campaign_id as campaign_id,
        s.source_on as lead_on,
        ms.mql_at,
        ms.sql_at,
        po.opportunity_on,
        po.won_on
    from {{ ref('int_person_source_campaign') }} s
    left join milestones ms on s.email = ms.email
    left join person_opportunity po on s.email = po.email
)

select
    m.campaign_id,
    m.email,
    m.member_at,
    st.lead_on,
    st.mql_at,
    st.sql_at,
    st.opportunity_on,
    st.won_on
from memberships m
left join source_stages st on m.email = st.email and m.campaign_id = st.campaign_id
