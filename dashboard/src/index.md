---
title: Fieldnote marketing performance
toc: false
---

<header class="wrap masthead">
  <div class="brand"><span class="brand-mark" aria-hidden="true"></span>Fieldnote <span class="brand-sub">marketing performance</span></div>
  <div class="mast-right">
    <div data-trust></div>
    <nav class="ext-links" aria-label="Project links"><a class="icon-link" href="https://github.com/ffmc/marketing-performance" aria-label="Repository" data-tip="Source code on GitHub: the pipeline, the dbt models and this page"><svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"/></svg></a><button type="button" class="icon-link" data-doc="metrics" aria-expanded="false" aria-controls="doc-pop" aria-label="Metric definitions" data-tip="Metric definitions"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 15V9M7.5 15V4M12 15v-7M16 15H2"/></svg></button><button type="button" class="icon-link" data-doc="brief" aria-expanded="false" aria-controls="doc-pop" aria-label="The brief" data-tip="The brief"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.5 2H5a1.5 1.5 0 00-1.5 1.5v11A1.5 1.5 0 005 16h8a1.5 1.5 0 001.5-1.5V6z"/><path d="M10.5 2v4h4M6.5 9.5h5M6.5 12.5h3.5"/></svg></button><a class="icon-link" href="https://www.linkedin.com/in/ffmc" aria-label="LinkedIn" data-tip="Francisco Cardoso on LinkedIn"><svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M0 1.15C0 .52.52 0 1.18 0h13.64C15.48 0 16 .52 16 1.15v13.7c0 .63-.52 1.15-1.18 1.15H1.18C.52 16 0 15.48 0 14.85V1.15zm4.94 12.24V6.17H2.542v7.22H4.94zM3.74 5.18c.84 0 1.36-.55 1.36-1.25-.01-.71-.52-1.25-1.34-1.25-.82 0-1.36.54-1.36 1.25 0 .7.52 1.25 1.33 1.25h.01zm4.91 8.21V9.36c0-.22.02-.43.08-.59.17-.43.57-.88 1.23-.88.87 0 1.21.66 1.21 1.63v3.87h2.4V9.25c0-2.22-1.18-3.25-2.76-3.25-1.27 0-1.84.7-2.16 1.19v.02h-.02l.02-.02V6.17h-2.4c.03.68 0 7.22 0 7.22h2.4z"/></svg></a></nav>
    <div id="doc-pop" class="doc-pop" role="dialog" aria-label="Project document" hidden></div>
  </div>
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
  <div class="context">
    <div><h2>The company</h2><p>Fieldnote is a fictional team-planning software company. Marketing reports leads, Sales reports pipeline, and nobody can say which campaigns produce deals that close.</p></div>
    <div><h2>The question</h2><p>Which campaigns create pipeline that closes, and what does each euro of spend return? This page is one set of numbers both teams can use.</p></div>
    <div><h2>The data</h2><p>Simulated Salesforce data with real-world problems such as duplicate leads, plus real ECB exchange rates. Every deal belongs to one source campaign, so nothing is counted twice.</p></div>
    <div><h2>How to read it</h2><p>Pick countries and channels above. Drag across the first chart to change the period. Every number and sentence on the page follows your selection.</p></div>
  </div>
  <div class="kpi-strip" data-c="kpis" aria-label="Headline metrics"></div>
</section>

<section class="section">
  <div class="copy">
    <h2 class="section-title">Where pipeline comes from</h2>
    <h3 class="sentence"><span data-t="top"></span> sourced <span class="hl" data-t="topShare"></span> of pipeline in the period.</h3>
    <p><span data-t="growth"></span> Monthly pipeline created, credited to each deal's source campaign. Drag across the chart to set the period for the whole page.</p>
  </div>
  <div class="chart" data-c="area"></div>
</section>

<section class="section">
  <div class="copy">
    <h2 class="section-title">Funnel</h2>
    <h3 class="sentence">The biggest drop is from <span data-t="dropFrom"></span> to <span data-t="dropTo"></span>: <span class="hl" data-t="dropRate"></span> move on.</h3>
    <p>People who joined a campaign in the period and every stage they reached. Select channels to see how their funnel differs. <button class="info inline" type="button" data-info="funnel">i</button></p>
  </div>
  <div class="chart" data-c="funnel"></div>
</section>

<section class="section">
  <div class="copy">
    <h2 class="section-title">Spend efficiency</h2>
    <h3 class="sentence"><span data-t="best"></span> returns <span class="hl" data-t="bestRatio"></span> of pipeline per euro spent.</h3>
    <p><span data-t="worst"></span> is the most expensive way to buy pipeline, at <span data-t="worstRatio"></span> per euro. Hover a dot for a campaign's cost per lead and per opportunity, or search the table below for a specific campaign.</p>
    <p class="footnote scatter-note"></p>
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
    <h2 class="section-title">Pipeline health</h2>
    <h3 class="sentence"><span class="hl" data-t="stalledCount"></span> open deals worth <span data-t="stalledAmount"></span> haven't moved in 30 days.</h3>
    <p>Open pipeline today is <span data-t="openTotal"></span>. The list below shows the deals to chase first. <button class="info inline" type="button" data-info="stalled">i</button></p>
  </div>
  <div class="chart" data-c="open"></div>
  <div class="wide">
    <h3>Stalled deals</h3>
    <div data-c="stalled"></div>
  </div>
</section>

<section class="section built">
  <div class="copy">
    <h2 class="section-title">How it's built</h2>
    <h3 class="sentence">One set of numbers, refreshed every morning.</h3>
    <p>If any data quality test fails, the page keeps yesterday's numbers.</p>
  </div>
  <div class="lineage" data-c="lineage"></div>
</section>

</div>

<footer class="wrap site-foot">
  <p>Created by <a href="https://www.linkedin.com/in/ffmc">Francisco Cardoso</a></p>
  <a href="https://github.com/ffmc/marketing-performance">View the repository on GitHub</a>
</footer>

```js
import {app} from "./components/app.js";

const [campaigns, campaignMonths, opportunities, meta, models, docs] = await Promise.all([
  FileAttachment("data/campaigns.csv").csv({typed: true}),
  FileAttachment("data/campaign_months.csv").csv({typed: true}),
  FileAttachment("data/opportunities.csv").csv({typed: true}),
  FileAttachment("data/meta.json").json(),
  FileAttachment("data/models.json").json(),
  FileAttachment("data/docs.json").json()
]);

app(document.body, {campaigns, campaignMonths, opportunities, meta, models, docs});
```
