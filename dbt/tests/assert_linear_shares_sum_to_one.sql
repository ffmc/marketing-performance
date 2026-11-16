select opportunity_id, sum(linear_share) as total_share
from {{ ref('int_opportunity_touchpoints') }}
group by opportunity_id
having abs(sum(linear_share) - 1) > 1e-9
