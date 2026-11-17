select opportunity_id
from {{ ref('fct_touchpoints') }}
group by opportunity_id
having abs(sum(first_touch_share) - 1) > 1e-9
    or abs(sum(last_touch_share) - 1) > 1e-9
    or abs(sum(linear_share) - 1) > 1e-9
