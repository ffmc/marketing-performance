with deliveries as (
    select
        lead_id,
        lead_status,
        system_modstamp_at,
        delivered_on,
        _file_row,
        lag(lead_status) over (partition by lead_id order by delivered_on, _file_row) as previous_status
    from {{ source('salesforce', 'leads') }}
    where lead_id in (select lead_id from {{ ref('int_leads__current') }})
)

select
    lead_id,
    lead_status,
    previous_status,
    system_modstamp_at as changed_at,
    row_number() over (partition by lead_id order by delivered_on, _file_row) as change_number
from deliveries
where previous_status is distinct from lead_status
