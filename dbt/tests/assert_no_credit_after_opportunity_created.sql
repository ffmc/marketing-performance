select opportunity_id, campaign_member_id, touched_on, opportunity_created_on
from {{ ref('fct_touchpoints') }}
where touched_on > opportunity_created_on
    and (first_touch_share > 0 or last_touch_share > 0 or linear_share > 0)
