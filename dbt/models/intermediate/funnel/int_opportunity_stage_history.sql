with history as (
    select
        opportunity_history_id,
        opportunity_id,
        stage_name,
        case stage_name
            when 'Discovery' then 1
            when 'Demo' then 2
            when 'Proposal' then 3
            when 'Negotiation' then 4
            when 'Closed Won' then 5
            when 'Closed Lost' then 5
        end as stage_sort_order,
        amount,
        close_on,
        probability,
        created_at as entered_at
    from {{ source('salesforce', 'opportunity_history') }}
    where not is_deleted
),

sequenced as (
    select
        *,
        lag(stage_name) over (partition by opportunity_id order by entered_at, opportunity_history_id) as previous_stage_name,
        lag(stage_sort_order) over (partition by opportunity_id order by entered_at, opportunity_history_id) as previous_stage_sort_order,
        lead(entered_at) over (partition by opportunity_id order by entered_at, opportunity_history_id) as exited_at
    from history
)

select
    opportunity_history_id,
    opportunity_id,
    stage_name,
    stage_sort_order,
    previous_stage_name,
    amount,
    close_on,
    probability,
    entered_at,
    exited_at,
    datediff('day', entered_at, exited_at) as days_in_stage,
    coalesce(stage_sort_order < previous_stage_sort_order, false) as is_regression,
    exited_at is null as is_current_stage
from sequenced
