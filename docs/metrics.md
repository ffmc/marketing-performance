# Metric definitions

Draft for agreement with the CMO. The marts implement exactly these; anything not here doesn't go on a dashboard.

## Attribution
Each lead and contact is attributed to one **source campaign**: its earliest touchpoint (defined under Touchpoints). If it has none, its earliest membership by `CreatedDate`. An opportunity inherits the source campaign of its primary contact role, falling back to `Opportunity.CampaignId`, then to `Unattributed`. Pipeline is attributed once, to one campaign, so campaign totals add up to the company total. Records with `IsDeleted = true` are ignored everywhere.

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

## Touchpoints
- **Touchpoint** = a `CampaignMember` with `HasResponded = true`, dated by `FirstRespondedDate`, or by the member's `CreatedDate` when that is null.
- A **person** is identified by email: a lead, its duplicates and the contact it converts into are the same person. A person counts once per campaign; if they responded to the same campaign more than once, the earliest response is kept.
- **Opportunity touchpoints** = the touchpoints of every contact role on the opportunity, dated on or before the date of `Opportunity.CreatedDate`. Touches after that date are excluded.
- Ties on date are broken by the member's `CreatedDate`, then its `Id`.

| Model | Credit for an opportunity |
|---|---|
| First touch (official) | 100% to the source campaign defined under Attribution |
| Last touch | 100% to the latest opportunity touchpoint |
| Linear | `Amount` / number of opportunity touchpoints, to each touchpoint's campaign |

- An opportunity with no touchpoints falls back to `Opportunity.CampaignId`, then `Unattributed`, in every model, so no model loses pipeline.
- Every model's campaign totals add up to company pipeline created and won revenue for the same month.
- **Influenced pipeline** = full `Amount` of every opportunity with at least one touchpoint from the campaign. It double-counts by design, so it is never summed across campaigns and is labelled "influenced" on screen.
- **Touches per opportunity** = count of opportunity touchpoints. **Days to opportunity** = days from the first opportunity touchpoint to `Opportunity.CreatedDate`.

## Velocity
- **Lead to MQL, MQL to opportunity, opportunity to close**: median days between the timestamps of the two stages.
- **Time in stage** = days between consecutive `OpportunityHistory` rows for the same opportunity.
- **Stalled** = open opportunity with no stage change in the last 30 days.
- **Stage regression** = an `OpportunityHistory` row whose stage sort order is lower than the previous one.
