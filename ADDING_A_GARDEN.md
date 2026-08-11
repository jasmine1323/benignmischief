# Adding a new garden

Each project garden is just a folder of Markdown notes under `gardens/`. One
shared Quartz engine builds them all, so **adding a garden takes no config and
no workflow changes** — you only add content.

Live layout:

- `https://www.benignmischief.com/gardens/` — the landing page (ASCII scene + list)
- `https://www.benignmischief.com/gardens/<slug>/` — one project garden

## The quick way

```bash
scripts/new-garden.sh <slug> "<Title>"
# e.g.
scripts/new-garden.sh moon-notes "Moon Notes"
```

This creates `gardens/<slug>/index.md` and adds a link on the landing page.
Then:

1. In Obsidian, **Open folder as vault** → pick `gardens/<slug>/`.
2. Write notes. Link between them with `[[wiki links]]`.
3. Commit and push. The site rebuilds and publishes automatically.

## The manual way

1. Make a folder: `gardens/<slug>/`.
2. Add an `index.md` with frontmatter `title:` — this becomes the garden's home page.
3. Add a link to it on the landing page (`gardens/index.md`) between the
   `<!-- gardens:start -->` / `<!-- gardens:end -->` markers:
   ```markdown
   - [[<slug>/index|Title]] — short description
   ```
4. Commit and push.

## Notes

- Every folder under `gardens/` is published. A folder's `index.md` is its home
  page; without one, Quartz auto-generates a folder listing.
- Add `draft: true` to a note's frontmatter to keep it unpublished.
- `.obsidian/` folders are ignored by the build, so each garden can be its own
  Obsidian vault.
- Images, `.canvas`, and `.base` files are supported and published alongside notes.
- To preview locally: `cd quartz && npx quartz build -d ../gardens --serve`
  then open the printed URL.
