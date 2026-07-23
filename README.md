# THInK Team-website 

THInK Team website uses Jekyll plugins beyond those supported by GitHub Pages.

## Publications & Invited Talks

Zotero is the single source of truth for publications and invited talks — you never hand-edit `_data/publications.yml` or `_data/invited-talks.yml` directly (they say so at the top of each file). `scripts/zotero-sync.ts` rebuilds both files from the group library at `zotero.org/groups/6616455/thinkteam`.

**To add a new publication or invited talk:** add the item to the Zotero group library (via the Zotero app, browser connector, or web library), then run:

```sh
ZOTERO_GROUP_ID=6616455 deno run -A scripts/zotero-sync.ts
```

This overwrites `_data/publications.yml` and `_data/invited-talks.yml` and commit the result. A few Zotero conventions to know:

- Item type controls where it ends up: `journalArticle` → journal, `conferencePaper` → conference, `bookSection` → book chapter, `patent` → patent, `presentation` → invited talk.
- Tag an item `website-ignore` to keep it in Zotero but hide it from the site.
- Zotero's built-in fields don't cover everything (awards, PDF links, code links, etc.) — put those in the item's **Extra** field, one per line, e.g.:
    Award: Best Paper Award.
    PDF: https://example.com/paper.pdf
    Code: https://github.com/THInK-Team/repo
    Link: https://example.com

- Don't rely on Zotero's own URL field for a "Link" — leave it blank unless you deliberately want a link to show; use `Link:` in Extra instead, since importers often auto-fill the URL field and that would show a bogus link on every citation.
