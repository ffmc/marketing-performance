with primary_roles as (
    select
        r.opportunity_id,
        r.contact_id,
        s.source_campaign_id
    from {{ ref('int_opportunity_contact_roles__current') }} r
    join {{ ref('int_people') }} p on r.contact_id = p.contact_id
    join {{ ref('int_person_source_campaign') }} s on p.email = s.email
    where r.is_primary
)

select
    o.opportunity_id,
    r.contact_id as primary_contact_id,
    coalesce(r.source_campaign_id, o.campaign_id, 'Unattributed') as source_campaign_id,
    case
        when r.source_campaign_id is not null then 'primary_contact'
        when o.campaign_id is not null then 'opportunity_campaign'
        else 'unattributed'
    end as source_type
from {{ ref('int_opportunities__current') }} o
left join primary_roles r on o.opportunity_id = r.opportunity_id
