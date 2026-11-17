with campaigns as (
      select
          campaign_id,
          campaign_name,
          campaign_type,
          -- Salesforce has no country field on Campaign; the naming convention is "YYYY-MM Type CC - Topic".
          regexp_substr(campaign_name, ' (ES|GB|US) - ', 1, 1, 'e', 1) as campaign_country,
          campaign_status,
          start_on,
          end_on,
          coalesce(actual_cost, budgeted_cost) as cost_eur,
          cost_eur is not null as has_cost
      from {{ ref('int_campaigns__current') }}
  )

  select * from campaigns

  union all

  select
      'Unattributed' as campaign_id,
      'Unattributed' as campaign_name,
      null as campaign_type,
      null as campaign_country,
      null as campaign_status,
      null as start_on,
      null as end_on,
      null as cost_eur,
      false as has_cost