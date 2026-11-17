with mart as (
    select model, month, sum(pipeline_created_eur) as pipeline_created_eur, sum(won_revenue_eur) as won_revenue_eur
    from {{ ref('mart_campaign_attribution') }}
    group by 1, 2
),

pipeline as (
    select date_trunc('month', created_on)::date as month, sum(amount_eur) as pipeline_created_eur
    from {{ ref('fct_opportunities') }}
    group by 1
),

won as (
    select date_trunc('month', close_on)::date as month, sum(won_amount_eur) as won_revenue_eur
    from {{ ref('fct_opportunities') }}
    where is_won
    group by 1
),

company as (
    select m.model, mo.month, coalesce(p.pipeline_created_eur, 0) as pipeline_created_eur, coalesce(w.won_revenue_eur, 0) as won_revenue_eur
    from (select month from pipeline union select month from won) mo
    cross join (select distinct model from mart) m
    left join pipeline p on mo.month = p.month
    left join won w on mo.month = w.month
)

select coalesce(c.model, m.model) as model, coalesce(c.month, m.month) as month, c.pipeline_created_eur as expected_pipeline, m.pipeline_created_eur as mart_pipeline, c.won_revenue_eur as expected_won, m.won_revenue_eur as mart_won
from company c
full outer join mart m on c.model = m.model and c.month = m.month
where abs(coalesce(c.pipeline_created_eur, 0) - coalesce(m.pipeline_created_eur, 0)) > 0.01
    or abs(coalesce(c.won_revenue_eur, 0) - coalesce(m.won_revenue_eur, 0)) > 0.01
