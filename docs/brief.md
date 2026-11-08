# Stakeholder brief

**From:** CMO, Fieldnote
**To:** Analytics Engineering

## Situation
Fieldnote (the same B2B team-planning SaaS as `saas-revenue-analytics`) spends on webinars, paid search, events, content and partner campaigns across Spain, the UK and the US. Marketing reports leads, Sales reports pipeline, and nobody can say which campaigns produce opportunities that close. Everything lives in Salesforce, but campaign membership, lead conversion and opportunity stages are messy enough that every export gives a different answer. I want a pipeline view by campaign that refreshes itself and that I can trust in the budget meeting.

## What I want to see
1. **Campaign funnel.** For each campaign: members, leads, MQLs, SQLs, opportunities, won deals, with conversion rates between each step.
2. **Pipeline by campaign and channel.** Pipeline created and won revenue in EUR, by campaign, channel, country and month.
3. **Cost efficiency.** Cost per lead, cost per MQL, cost per opportunity and pipeline-to-spend ratio for every campaign with a budget.
4. **Velocity.** Days from lead to MQL, MQL to opportunity, and opportunity to close, plus time spent in each opportunity stage.
5. **Pipeline health.** Open pipeline by stage, stalled opportunities (no stage change in 30 days) and stage regressions.
6. **Trust.** Daily refresh orchestrated end to end, data quality tests that stop bad data before it reaches a report, and every metric defined once in `metrics.md`.

## Non-goals
Multi-touch attribution models, forecasting, real-time data, ad platform spend ingestion (costs come from the Salesforce campaign record).

## What would make this a failure even if it works
- Pipeline counted twice because a lead sat in two campaigns.
- A conversion rate on screen that isn't defined in `metrics.md`.
- A refresh that needs someone to run it by hand.
