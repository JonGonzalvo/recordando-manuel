# Recordando a Manuel

Memorial page for Manuel Crosthwaite: https://jongonzalvo.github.io/recordando-manuel/

Anyone with the link can read and post memories (no account). Memories are stored in Supabase
(project `recordando-manuel`) and translated between English and Spanish by Claude.

- `src/page.html` is the page. `scripts/build.mjs` turns it into `docs/index.html`, which GitHub Pages serves.
- `supabase/migrations/` is the database: one `memories` table. Visitors can read visible rows and add new ones;
  a poster can remove their own memory from the same browser.
- `supabase/functions/translate/` translates a memory with the Claude API and caches it on the row.
  Needs the secret `ANTHROPIC_API_KEY`: `supabase secrets set ANTHROPIC_API_KEY=... --project-ref gimqlhciucrallibgytv`
- `.github/workflows/snapshot.yml` saves a copy of the memories into the page every 6 hours. The page shows that
  copy if Supabase can't be reached.
- `.github/workflows/keep-supabase-awake.yml` pings Supabase once a day (one database row, auth health, the
  translate function) so the free project doesn't pause, and fails, emailing the repo owner, if it's down. It
  also re-enables both scheduled workflows so GitHub doesn't switch them off after 60 days without commits.

## Moderating

In the Supabase dashboard, open Table Editor → `memories`. Set `hidden` to true to take a memory off the page,
or delete the row.

## Rebuilding by hand

    node scripts/snapshot.mjs
    node scripts/build.mjs
