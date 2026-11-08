# Metric definitions

Draft for agreement with the CMO. The marts implement exactly these; anything not here doesn't go on a dashboard.

## Attribution
Each lead and contact is attributed to one **source campaign**: the earliest `CampaignMember` record with `HasResponded = true`, by `FirstRespondedDate`. If there is none, the earliest membership by `CreatedDate`. An opportunity inherits the source campaign of its primary contact role, falling back to `Opportunity.CampaignId`. Pipeline is attributed once, to one campaign, so campaign totals add up to the company total.

## Funnel stages
| Stage | Rule |
|---|---|
| member | a `CampaignMember` row for the campaign |
| lead | a lead or contact whose source campaign is this campaign |
| MQL | `Lead.Status` reached `MQL` (first time, from field history) |
| SQL | `Lead.Status` reached `SQL`, or the lead was converted |
| opportunity | a converted lead with `ConvertedOpportunityId`, or an opportunity attributed to the campaign |
| won | opportunity with `IsWon = true` |

Conversion rate between two stages = records reaching the later stage / records reaching the earlier one, by the month of the earlier stage (cohort view).

## Revenue
- **Pipeline created** = `Amount` of opportunities by their `CreatedDate` month, in EUR.
- **Won revenue** = `Amount` of won opportunities by `CloseDate` month, in EUR.
- **Open pipeline** = `Amount` of opportunities with `IsClosed = false` at the end of the day measured.
- EUR conversion uses the ECB reference rate of the last business day on or before the date measured.

## Cost
- Campaign cost = `Campaign.ActualCost`, falling back to `BudgetedCost` when actual is null. Campaigns with neither are excluded from cost metrics and flagged.
- **Cost per lead / MQL / opportunity** = campaign cost / count at that stage.
- **Pipeline to spend** = pipeline created / campaign cost.

## Velocity
- **Lead to MQL, MQL to opportunity, opportunity to close**: median days between the timestamps of the two stages.
- **Time in stage** = days between consecutive `OpportunityHistory` rows for the same opportunity.
- **Stalled** = open opportunity with no stage change in the last 30 days.
- **Stage regression** = an `OpportunityHistory` row whose stage sort order is lower than the previous one.
