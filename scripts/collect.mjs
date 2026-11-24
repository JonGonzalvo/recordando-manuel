// Turns a dump of the Claude page's database into data/memories.json.
//
//   node scripts/collect.mjs .cache/db
//
// Reads  <dump>/stories/*.json       one doc per coworker: { entries: [...] }
//        <dump>/translations/*.json  shared translations: { en?: {story, context}, es?: {...} }
//        data/translations/*.json    translations made by the sync job, same shape
// Writes data/memories.json          { updatedAt, entries: [...] }  (updatedAt moves only when the memories change)
// Prints a JSON array of memories still missing a translation, for the sync job to fill in.

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const dump = process.argv[2];
if (!dump) { console.error("usage: node scripts/collect.mjs <dumpDir>"); process.exit(1); }

const readDir = (dir) => {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => {
    try { return { id: f.slice(0, -5), data: JSON.parse(readFileSync(join(dir, f), "utf8")) }; }
    catch { return null; }
  }).filter(Boolean);
};

const str = (v) => (typeof v === "string" ? v : "");
const cleanTr = (v) => (v && typeof v === "object" && str(v.story).trim()
  ? { story: str(v.story).trim(), context: str(v.context).trim() } : null);

// Translations: the sync job's own first, shared ones from the page win.
const tr = {};
for (const src of [join(ROOT, "data/translations"), join(dump, "translations")]) {
  for (const { id, data } of readDir(src)) {
    for (const lang of ["en", "es"]) {
      const v = cleanTr(data && data[lang]);
      if (v) (tr[id] ||= {})[lang] = v;
    }
  }
}

const entries = [];
for (const { data } of readDir(join(dump, "stories"))) {
  for (const e of Array.isArray(data && data.entries) ? data.entries : []) {
    if (!e || !str(e.id) || !str(e.original).trim()) continue;
    const source = e.source === "es" ? "es" : "en";
    const out = {
      id: str(e.id),
      createdAt: str(e.createdAt),
      signature: str(e.signature).trim(),
      original: str(e.original).trim(),
      contextOriginal: str(e.contextOriginal).trim(),
      source,
    };
    if (tr[out.id]) out.translations = tr[out.id];
    entries.push(out);
  }
}
entries.sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));

const file = join(ROOT, "data/memories.json");
let prev = null;
try { prev = JSON.parse(readFileSync(file, "utf8")); } catch {}
const changed = !prev || JSON.stringify(prev.entries) !== JSON.stringify(entries);
const data = { updatedAt: changed ? new Date().toISOString() : prev.updatedAt, entries };
writeFileSync(file, JSON.stringify(data, null, 2) + "\n");

const missing = entries
  .filter((e) => !(e.translations && e.translations[e.source === "es" ? "en" : "es"]))
  .map((e) => ({ id: e.id, from: e.source, to: e.source === "es" ? "en" : "es", story: e.original, context: e.contextOriginal }));

console.error(`${entries.length} memories, ${missing.length} missing a translation, ${changed ? "changed" : "unchanged"}`);
console.log(JSON.stringify(missing, null, 2));
