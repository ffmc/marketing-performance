with leads as (
    select
        lower(trim(email)) as email_clean,
        lead_id,
        created_at,
        is_converted,
        converted_on,
        converted_contact_id,
        converted_account_id,
        converted_opportunity_id
    from {{ ref('int_leads__current') }}
    where nullif(trim(email), '') is not null
),

primary_lead as (
    select *
    from leads
    qualify row_number() over (
        partition by email_clean
        order by is_converted desc, created_at, lead_id
    ) = 1
),

lead_groups as (
    select
        email_clean,
        count(*) as lead_count,
        array_agg(lead_id) within group (order by created_at, lead_id) as lead_ids
    from leads
    group by email_clean
),

people_from_leads as (
    select
        p.email_clean,
        p.lead_id as primary_lead_id,
        g.lead_ids,
        g.lead_count,
        p.created_at as lead_created_at,
        p.is_converted,
        p.converted_on,
        p.converted_contact_id,
        p.converted_account_id,
        p.converted_opportunity_id
    from primary_lead p
    join lead_groups g on p.email_clean = g.email_clean
),

contacts as (
    select
        lower(trim(email)) as email_clean,
        contact_id,
        account_id
    from {{ ref('int_contacts__current') }}
    where nullif(trim(email), '') is not null
)

select
    coalesce(l.email_clean, c.email_clean) as email,
    l.primary_lead_id,
    l.lead_ids,
    coalesce(l.lead_count, 0) as lead_count,
    l.lead_created_at,
    coalesce(l.is_converted, false) as is_converted,
    l.converted_on,
    c.contact_id,
    coalesce(c.account_id, l.converted_account_id) as account_id,
    l.converted_contact_id,
    l.converted_opportunity_id
from people_from_leads l
full outer join contacts c on l.email_clean = c.email_clean