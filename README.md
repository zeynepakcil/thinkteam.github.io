# THInK Team-website 

THInK Team website uses Jekyll plugins beyond those supported by GitHub Pages.

## Publications & Invited Talks

Zotero is the source for publications and invited talks, no need to manual edit `_data/publications.yml` or `_data/invited-talks.yml` directly. `scripts/zotero-sync.ts` rebuilds both files from the group library at `zotero.org/groups/6616455/thinkteam`.

**To add a new publication or invited talk:** 
Add the item to the Zotero group library (via the Zotero app, browser connector (best option), or web library), and run:

```sh
ZOTERO_GROUP_ID=6616455 deno run -A scripts/zotero-sync.ts
```

This overwrites `_data/publications.yml` and `_data/invited-talks.yml` and commit the result. A few Zotero conventions to know:

- Item type controls where it ends up: 
    - `journalArticle` for journal papers, 
    - `conferencePaper` for conference papers, 
    - `bookSection` for book chapters, 
    - `patent` for patents, 
    - `presentation` for invited talks.
- Tag an item `website-ignore` to keep it in Zotero but hide it from the site.
- Zotero's built-in fields don't cover everything (awards, PDF links, code links, etc.). Put those in the item's **Extra** field, one per line, e.g.:  
    Award: Best Paper Award.  
    PDF: https://example.com/paper.pdf  
    Code: https://github.com/THInK-Team/repo  
    Link: https://example.com  

- Don't rely on Zotero's own URL field for a "Link", use `Link:` in Extra instead.


## Adding a team member

Copy `_members/template.md` to `_members/yourfirst-yourlast.md`. Filename becomes that person's ID and it is used to link them to news posts, projects, and publications. 
Fill in the front matter: name, add and link your photo (goes in `assets/img/members/fullsize/`), job title, role, and start/end dates. 
Write a short bio below the front matter.


## Adding a news post

Add a new file to `_news/`, named `YYYY-MM-DD-yournews.md`:

```yaml
---
title: Short Headline Here
blurb: One-sentence summary shown in the news list and on the homepage.
date: 'yyyy-mm-dd'
members: ['first-last', 'first-last']
projects: []
---

Full story text in Markdown.
```

`members` should list filenames from `_members/` (without `.md`) so the post shows up automatically on each person's profile page. 
Always set `date` explicitly rather than leaving it out.
