# Recordando a Manuel

Family copy of the memorial page for Manuel Crosthwaite.

- Coworkers post memories on the Claude page: https://claude.ai/artifact/32z2n48HHRTQg2upry7iue
- A scheduled Claude job follows [SYNC.md](SYNC.md): it copies new memories here, translates them, rebuilds `docs/` and pushes.
- GitHub Pages serves `docs/`.

`src/page.html` is the page itself (the same file the Claude page publishes). To rebuild by hand:

    node scripts/collect.mjs .cache/db   # after dumping the Claude page's database into .cache/db
    node scripts/build.mjs
