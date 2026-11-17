const SITE = "https://ffmc.github.io/marketing-performance/";
const TITLE = "Fieldnote marketing performance";
const DESCRIPTION = "Which campaigns create pipeline that closes: an end-to-end analytics engineering project with Salesforce data, Snowflake, dbt, Airflow and D3.";

export default {
  title: TITLE,
  root: "src",
  base: "/marketing-performance/",
  pages: [],
  sidebar: false,
  toc: false,
  pager: false,
  search: false,
  header: "",
  footer: "",
  style: "style.css",
  interpreters: {".py": [process.env.DASHBOARD_PYTHON ?? "python3"]},
  head: `
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@500..800&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">
<meta name="description" content="${DESCRIPTION}">
<meta property="og:type" content="website">
<meta property="og:url" content="${SITE}">
<meta property="og:title" content="${TITLE}">
<meta property="og:description" content="${DESCRIPTION}">
<meta property="og:image" content="${SITE}og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="627">
<meta name="twitter:card" content="summary_large_image">`
};
