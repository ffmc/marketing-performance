select opportunity_id, count(distinct campaign_id) as first_touch_campaigns
from {{ ref('fct_touchpoints') }}
where first_touch_share > 0
group by opportunity_id
having count(distinct campaign_id) > 1
