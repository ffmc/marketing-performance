{% macro current_state(source_table, id_column) %}
with latest as (
    select *
    from {{ source('salesforce', source_table) }}
    qualify row_number() over (partition by {{ id_column }} order by delivered_on desc, _file_row desc) = 1
)

-- Filter after picking the latest delivery: a record deleted today must drop out, not fall back to yesterday's copy.
select * exclude (is_deleted)
from latest
where not is_deleted
{% endmacro %}
