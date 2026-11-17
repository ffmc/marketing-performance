with funnel as (
    select
        campaign_id,
        date_trunc('month', member_at)::date as month,
        count(*) as members,
        count(lead_on) as leads,
        count(mql_at) as mqls,
        count(sql_at) as sqls,
        count(opportunity_on) as opportunities,
        count(won_on) as won_deals
    from {{ ref('fct_campaign_funnel') }}
    group by 1, 2
),

pipeline as (
    select
        source_campaign_id as campaign_id,
        date_trunc('month', created_on)::date as month,
        sum(amount_eur) as pipeline_created_eur
    from {{ ref('fct_opportunities') }}
    group by 1, 2
),

won as (
    select
        source_campaign_id as campaign_id,
        date_trunc('month', close_on)::date as month,
        sum(won_amount_eur) as won_revenue_eur
    from {{ ref('fct_opportunities') }}
    where is_won
    group by 1, 2
),

campaign_months as (
    select
        c.campaign_id,
        c.start_on,
        c.end_on,
        c.cost_eur,
        dateadd('month', n.offset, date_trunc('month', c.start_on))::date as month
    from {{ ref('dim_campaigns') }} c
    join (select row_number() over (order by seq4()) - 1 as offset from table(generator(rowcount => 120))) n
        on dateadd('month', n.offset, date_trunc('month', c.start_on)) <= c.end_on
    where c.has_cost
),

-- Cost is spread evenly over the campaign's run days, so monthly cost sums to the campaign's cost.
cost as (
    select
        campaign_id,
        month,
        cost_eur
            * (datediff('day', greatest(start_on, month), least(end_on, last_day(month))) + 1)
            / (datediff('day', start_on, end_on) + 1) as cost_eur
    from campaign_months
),

lead_to_mql as (
    select
        campaign_id,
        date_trunc('month', mql_at)::date as month,
        median(datediff('day', lead_on, mql_at)) as median_days_lead_to_mql
    from {{ ref('fct_campaign_funnel') }}
    where mql_at is not null
    group by 1, 2
),

mql_to_opportunity as (
    select
        campaign_id,
        date_trunc('month', opportunity_on)::date as month,
        median(datediff('day', mql_at, opportunity_on)) as median_days_mql_to_opportunity
    from {{ ref('fct_campaign_funnel') }}
    where opportunity_on is not null and mql_at is not null
    group by 1, 2
),

opportunity_to_close as (
    select
        source_campaign_id as campaign_id,
        date_trunc('month', close_on)::date as month,
        median(datediff('day', created_on, close_on)) as median_days_opportunity_to_close
    from {{ ref('fct_opportunities') }}
    where is_closed
    group by 1, 2
),

spine as (
    select campaign_id, month from funnel
    union select campaign_id, month from pipeline
    union select campaign_id, month from won
    union select campaign_id, month from cost
    union select campaign_id, month from lead_to_mql
    union select campaign_id, month from mql_to_opportunity
    union select campaign_id, month from opportunity_to_close
)

select
    s.campaign_id,
    s.month,
    d.campaign_name,
    d.campaign_type,
    d.has_cost,
    coalesce(f.members, 0) as members,
    coalesce(f.leads, 0) as leads,
    coalesce(f.mqls, 0) as mqls,
    coalesce(f.sqls, 0) as sqls,
    coalesce(f.opportunities, 0) as opportunities,
    coalesce(f.won_deals, 0) as won_deals,
    f.leads / nullif(f.members, 0) as member_to_lead_rate,
    f.mqls / nullif(f.leads, 0) as lead_to_mql_rate,
    f.sqls / nullif(f.mqls, 0) as mql_to_sql_rate,
    f.opportunities / nullif(f.sqls, 0) as sql_to_opportunity_rate,
    f.won_deals / nullif(f.opportunities, 0) as opportunity_to_won_rate,
    coalesce(p.pipeline_created_eur, 0) as pipeline_created_eur,
    coalesce(w.won_revenue_eur, 0) as won_revenue_eur,
    iff(d.has_cost, coalesce(c.cost_eur, 0), null) as cost_eur,
    c.cost_eur / nullif(f.leads, 0) as cost_per_lead_eur,
    c.cost_eur / nullif(f.mqls, 0) as cost_per_mql_eur,
    c.cost_eur / nullif(f.opportunities, 0) as cost_per_opportunity_eur,
    p.pipeline_created_eur / nullif(c.cost_eur, 0) as pipeline_to_spend,
    lm.median_days_lead_to_mql,
    mo.median_days_mql_to_opportunity,
    oc.median_days_opportunity_to_close
from spine s
join {{ ref('dim_campaigns') }} d on s.campaign_id = d.campaign_id
left join funnel f on s.campaign_id = f.campaign_id and s.month = f.month
left join pipeline p on s.campaign_id = p.campaign_id and s.month = p.month
left join won w on s.campaign_id = w.campaign_id and s.month = w.month
left join cost c on s.campaign_id = c.campaign_id and s.month = c.month
left join lead_to_mql lm on s.campaign_id = lm.campaign_id and s.month = lm.month
left join mql_to_opportunity mo on s.campaign_id = mo.campaign_id and s.month = mo.month
left join opportunity_to_close oc on s.campaign_id = oc.campaign_id and s.month = oc.month
