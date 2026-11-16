select * from {{ref('int_campaigns__current')}}

select 
campaign_id, 
campaign_name,
campaign_type,
campaign_status,
parent_campaign_id, 
start_on,
end_on,
actual_cost,
budgeted_cost,
coalesce(actual_cost, budgeted_cost) as cost_eur,
cost_eur is not null as has_cost,
created_at,
last_modified_at,
delivered_on
from {{ref('int_campaigns__current')}}