select
    lead_id,
    min(iff(lead_status = 'MQL', changed_at, null)) as first_mql_at,
    -- A converted lead counts as SQL (metrics.md), so Converted also sets the SQL date.
    min(iff(lead_status in ('SQL', 'Converted'), changed_at, null)) as first_sql_at
from {{ ref('int_lead_status_history') }}
group by lead_id
