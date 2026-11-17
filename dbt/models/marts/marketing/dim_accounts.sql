select
    account_id,
    account_name,
    billing_country,
    industry,
    number_of_employees,
    owner_user_id
from {{ ref('int_accounts__current') }}