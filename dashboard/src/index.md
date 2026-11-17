---
title: Fieldnote marketing performance
toc: false
---

<header class="wrap masthead">
  <div class="brand"><span class="brand-mark" aria-hidden="true"></span>Fieldnote <span class="brand-sub">marketing performance</span></div>
  <div data-trust></div>
</header>

<div class="filters">
  <div class="wrap">
    <div class="seg" role="radiogroup" aria-label="Country" id="country-seg"></div>
    <div class="chips" role="group" aria-label="Channels (select several)" id="channel-chips"></div>
  </div>
</div>

<div class="wrap story">

<section class="hero">
  <span class="eyebrow"><span data-t="period"></span> · <span data-t="scope"></span></span>
  <h1><span data-t="who"></span> created <span class="hl" data-t="pipeline"></span> of pipeline and closed <span class="hl" data-t="won"></span>.</h1>
  <p class="lede">Every lead and deal belongs to exactly one source campaign, so nothing on this page is counted twice. Pick channels and countries above; drag across the chart below to change the period.</p>
  <div class="kpi-strip" data-c="kpis" aria-label="Headline metrics"></div>
</section>

<section class="section">
  <div class="copy">
    <span class="eyebrow">Where pipeline comes from</span>
    <h2><span data-t="top"></span> sourced <span class="hl" data-t="topShare"></span> of pipeline in the period.</h2>
    <p><span data-t="growth"></span> Monthly pipeline created, credited to each deal's source campaign. Drag across the chart to set the period for the whole page.</p>
  </div>
  <div class="chart" data-c="area"></div>
</section>

<section class="section">
  <div class="copy">
    <span class="eyebrow">Funnel</span>
    <h2>The biggest drop is from <span data-t="dropFrom"></span> to <span data-t="dropTo"></span>: <span class="hl" data-t="dropRate"></span> move on.</h2>
    <p>People who joined a campaign in the period and every stage they reached. Bars show the share that moved on from the stage before. Select channels to compare them with all channels. <button class="info inline" type="button" data-info="funnel">i</button></p>
  </div>
  <div class="chart" data-c="funnel"></div>
</section>

<section class="section">
  <div class="copy">
    <span class="eyebrow">Spend efficiency</span>
    <h2><span data-t="best"></span> returns <span class="hl" data-t="bestRatio"></span> of pipeline per euro spent.</h2>
    <p><span data-t="worst"></span> is the most expensive way to buy pipeline, at <span data-t="worstRatio"></span> per euro. Hover a dot for a campaign's cost per lead and per opportunity, or search the table below for a specific campaign.</p>
  </div>
  <div class="chart" data-c="scatter"></div>
  <div class="wide">
    <h3>By channel <button class="info inline" type="button" data-info="cpl">i</button></h3>
    <div data-c="channels"></div>
  </div>
  <div class="wide">
    <div class="tb-head"><h3>Every campaign</h3>
      <label class="search"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.6"/><path d="M11 11l3.5 3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
      <input id="campaign-search" type="search" placeholder="Find a campaign, channel or country" autocomplete="off" aria-label="Find a campaign"></label>
    </div>
    <div data-c="campaigns"></div>
  </div>
</section>

<section class="section">
  <div class="copy">
    <span class="eyebrow">Sourced or assisted</span>
    <h2><span data-t="lin"></span> grows <span class="hl" data-t="linPct"></span> when credit is shared across every touch.</h2>
    <p>First touch decides the budget. Last touch and linear show which channels help close deals that other channels found. <button class="info inline" type="button" data-info="attribution">i</button></p>
  </div>
  <div class="chart" data-c="attribution"></div>
  <div class="wide split">
    <div>
      <h3>Campaigns that assist the most <button class="info inline" type="button" data-info="influenced">i</button></h3>
      <div data-c="influence"></div>
    </div>
    <div>
      <h3>Touches before a deal is created <button class="info inline" type="button" data-info="touches">i</button></h3>
      <div data-c="touches"></div>
    </div>
  </div>
</section>

<section class="section">
  <div class="copy">
    <span class="eyebrow">Speed</span>
    <h2>Deals take a median of <span class="hl" data-t="close"></span> from opportunity to close.</h2>
    <p>Leads reach MQL in a median <span data-t="leadMql"></span>. Of the sales stages, <span data-t="slowest"></span> holds deals longest, at <span data-t="slowestDays"></span>. <button class="info inline" type="button" data-info="velocity stage">i</button></p>
  </div>
  <div class="chart" data-c="velocity"></div>
  <div class="wide narrow-right">
    <h3>Median days in each sales stage</h3>
    <div data-c="stages"></div>
  </div>
</section>

<section class="section">
  <div class="copy">
    <span class="eyebrow">Pipeline health</span>
    <h2><span class="hl" data-t="stalledCount"></span> open deals worth <span data-t="stalledAmount"></span> haven't moved in 30 days.</h2>
    <p>Open pipeline today is <span data-t="openTotal"></span>. Stage changes in the period, with backward moves in amber. <button class="info inline" type="button" data-info="stalled regression">i</button></p>
  </div>
  <div class="chart" data-c="open"></div>
  <div class="wide">
    <h3>Stage changes</h3>
    <div data-c="flow"></div>
  </div>
  <div class="wide">
    <h3>Stalled deals</h3>
    <div data-c="stalled"></div>
  </div>
</section>

<section class="section built">
  <div class="copy">
    <span class="eyebrow">How it's built</span>
    <h2>One set of numbers, refreshed every morning.</h2>
    <p>Salesforce data is simulated with real-world problems: duplicate leads, conversions, people in several campaigns and deals moving backwards. Exchange rates are real. If any data quality test fails, the page keeps yesterday's numbers.</p>
  </div>
  <ol class="lineage">
    <li><b>Salesforce</b><span>Daily extracts</span></li>
    <li><b>Snowflake RAW</b><span>Loaded as delivered</span></li>
    <li><b>Silver</b><span>Cleaned and checked</span></li>
    <li><b>dbt</b><span>Modelled and tested</span></li>
    <li><b>This page</b><span>Built when every test passes</span></li>
  </ol>
  <p class="links"><a href="https://github.com/ffmc/marketing-performance">Repository</a><a href="https://github.com/ffmc/marketing-performance/blob/main/docs/metrics.md">Metric definitions</a><a href="https://github.com/ffmc/marketing-performance/blob/main/docs/brief.md">The brief</a></p>
</section>

</div>

```js
import {app} from "./components/app.js";

const [campaigns, campaignMonths, attribution, opportunities, stageHistory, leadVelocity, meta] = await Promise.all([
  FileAttachment("data/campaigns.csv").csv({typed: true}),
  FileAttachment("data/campaign_months.csv").csv({typed: true}),
  FileAttachment("data/attribution.csv").csv({typed: true}),
  FileAttachment("data/opportunities.csv").csv({typed: true}),
  FileAttachment("data/stage_history.csv").csv({typed: true}),
  FileAttachment("data/lead_velocity.csv").csv({typed: true}),
  FileAttachment("data/meta.json").json()
]);

app(document.body, {campaigns, campaignMonths, attribution, opportunities, stageHistory, leadVelocity, meta});
```
