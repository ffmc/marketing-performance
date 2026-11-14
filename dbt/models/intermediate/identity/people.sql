WITH clean_leads AS (
  SELECT  lower(EMAIL) as email
  FROM {{ref("int_leads__current")}}
)
SELECT * FROM clean_leads