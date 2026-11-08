# Source data

## What is real and what is simulated
- **Salesforce data is simulated** by `simulator/simulate.py` (built in phase 1). Records follow the shape of Salesforce REST API objects. The company, campaigns, people and deals are invented, with rates in realistic B2B SaaS ranges.
- The simulator is deterministic (fixed seed): the same date always produces the same files.

## How records arrive
Each object is extracted daily on `SystemModstamp`, so a record is delivered again on every day it changes, as its full current state. Every raw table has the same columns as in `saas-revenue-analytics`: `RAW` (VARIANT), `_FILE`, `_FILE_ROW`, `_LOADED_AT`.

## Tables

| Table | One row per | Key fields |
|---|---|---|
| `RAW.SALESFORCE.CAMPAIGNS` | campaign × day it changed | `Id`, `Name`, `Type`, `Status`, `StartDate`, `EndDate`, `BudgetedCost`, `ActualCost`, `ParentId` |
| `RAW.SALESFORCE.CAMPAIGN_MEMBERS` | membership × day it changed | `Id`, `CampaignId`, `LeadId`, `ContactId`, `Status`, `HasResponded`, `FirstRespondedDate`, `CreatedDate` |
| `RAW.SALESFORCE.LEADS` | lead × day it changed | `Id`, `Email`, `Company`, `Country`, `LeadSource`, `Status`, `IsConverted`, `ConvertedContactId`, `ConvertedAccountId`, `ConvertedOpportunityId`, `ConvertedDate` |
| `RAW.SALESFORCE.CONTACTS` | contact × day it changed | `Id`, `AccountId`, `Email`, `LeadSource` |
| `RAW.SALESFORCE.ACCOUNTS` | account × day it changed | `Id`, `Name`, `BillingCountry`, `Industry`, `NumberOfEmployees` |
| `RAW.SALESFORCE.OPPORTUNITIES` | opportunity × day it changed | `Id`, `AccountId`, `CampaignId`, `StageName`, `Amount`, `CurrencyIsoCode`, `CloseDate`, `IsClosed`, `IsWon`, `OwnerId` |
| `RAW.SALESFORCE.OPPORTUNITY_HISTORY` | stage change | `Id`, `OpportunityId`, `StageName`, `Amount`, `CreatedDate` |
| `RAW.SALESFORCE.USERS` | sales rep | `Id`, `Name`, `UserRoleId`, `IsActive` |

## Planned quirks
1. **Latest state.** Records are re-delivered on every change; pick the latest per `Id`.
2. **Duplicate leads.** About 2% of leads are created twice with the same email (form resubmits), with different `Id`s.
3. **Lead conversion.** A converted lead stops changing and its history continues on the contact and opportunity, so the funnel has to stitch the two.
4. **Multi-campaign members.** A lead can belong to several campaigns, which double-counts pipeline unless attribution picks one.
5. **Stage regressions.** About 5% of opportunities move back a stage before closing.
6. **Missing costs.** Some campaigns have no `ActualCost`, and a few have neither actual nor budgeted cost.
7. **Currencies.** Opportunity amounts are in EUR, GBP or USD (`CurrencyIsoCode`), converted with ECB rates.
8. **Picklist change.** The `Lead.Status` value `Working` is renamed `Contacted` partway through history, so both values exist.
9. **Deleted records.** Merged and deleted leads arrive with `IsDeleted = true`.
