// Builds the family copy: src/page.html + data/memories.json -> docs/index.html
//
//   node scripts/build.mjs

import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const page = readFileSync(join(ROOT, "src/page.html"), "utf8");
const data = JSON.parse(readFileSync(join(ROOT, "data/memories.json"), "utf8"));

const keepsake = { family: true, updatedAt: data.updatedAt || null, entries: data.entries || [] };
const json = JSON.stringify(keepsake).replace(/</g, "\\u003c");

const block = /<script type="application\/json" id="keepsake">[\s\S]*?<\/script>/;
if (!block.test(page)) throw new Error("keepsake block not found in src/page.html");
const html = page.replace(block, () => `<script type="application/json" id="keepsake">${json}</script>`);

// The Claude viewer wraps the page in its own skeleton; outside it we add one.
const cut = html.indexOf("</style>") + "</style>".length;
const out = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
<meta name="description" content="En memoria de Manuel Crosthwaite. Recuerdos de sus compañeros de trabajo.">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>
${html.slice(0, cut)}
</head>
<body>
${html.slice(cut)}
</body>
</html>
`;

mkdirSync(join(ROOT, "docs"), { recursive: true });
writeFileSync(join(ROOT, "docs/index.html"), out);
copyFileSync(join(ROOT, "src/manuel.jpg"), join(ROOT, "docs/manuel.jpg"));
writeFileSync(join(ROOT, "docs/.nojekyll"), "");
writeFileSync(join(ROOT, "docs/robots.txt"), "User-agent: *\nDisallow: /\n");
console.error(`built docs/index.html with ${keepsake.entries.length} memories`);
