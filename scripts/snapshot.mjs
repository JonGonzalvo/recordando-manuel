// Saves a copy of all visible memories into data/memories.json.
// The page shows this copy if Supabase can't be reached (for example, a paused project).
// Reading also counts as activity, which keeps a free Supabase project from pausing.
//
//   node scripts/snapshot.mjs

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const { supabaseUrl, publishableKey } = JSON.parse(readFileSync(join(ROOT, "site.config.json"), "utf8"));

const res = await fetch(
  `${supabaseUrl}/rest/v1/memories?select=id,created_at,signature,context,original,source,translations&order=created_at.asc&limit=1000`,
  { headers: { apikey: publishableKey } },
);
if (!res.ok) { console.error(`Supabase answered ${res.status}: ${await res.text()}`); process.exit(1); }
const rows = await res.json();

const entries = rows.map((r) => ({
  id: r.id,
  createdAt: r.created_at,
  signature: r.signature,
  original: r.original,
  contextOriginal: r.context || "",
  source: r.source,
  translations: r.translations || {},
}));

const file = join(ROOT, "data/memories.json");
let prev = null;
try { prev = JSON.parse(readFileSync(file, "utf8")); } catch {}
const changed = !prev || JSON.stringify(prev.entries) !== JSON.stringify(entries);
mkdirSync(join(ROOT, "data"), { recursive: true });
writeFileSync(file, JSON.stringify({ updatedAt: changed ? new Date().toISOString() : prev.updatedAt, entries }, null, 2) + "\n");
console.error(`${entries.length} memories, ${changed ? "changed" : "unchanged"}`);
