import {readFileSync} from "node:fs";
import MarkdownIt from "markdown-it";

const md = new MarkdownIt();
const doc = (name) => {
  const src = readFileSync(new URL(`../../../docs/${name}.md`, import.meta.url), "utf8");
  const [, title, body] = src.match(/^# (.+)\n([\s\S]*)$/);
  return {title, html: md.render(body)};
};

process.stdout.write(JSON.stringify({metrics: doc("metrics"), brief: doc("brief")}));
