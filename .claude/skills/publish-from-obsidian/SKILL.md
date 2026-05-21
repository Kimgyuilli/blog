---
name: publish-from-obsidian
description: Import an Obsidian-authored markdown post (with image attachments) into this Astro blog. Use when the user provides a path to an .md file written in Obsidian (typically inside their vault) and wants it published as a blog post — handles Obsidian wikilink images (`![[file.png]]`), copies attachments into `public/images/blog/<slug>/`, rewrites image references, fills/validates frontmatter (title, description, pubDate, category, tags, slug, draft), and places the final file at `src/content/blog/<slug>.md`.
---

# Publish from Obsidian

This skill imports a post written in Obsidian into this Astro blog. The user writes freely in their vault — embedding images via drag-and-drop, using Obsidian Properties for frontmatter — and this skill normalizes it into the shape the blog expects.

## When to invoke

The user says something like:
- "옵시디언에서 쓴 글 올려줘"
- "이 노트 블로그에 업로드해줘: <path>"
- "vault/<some-note>.md 가져와줘"
- Or provides a path to a markdown file with attachments and asks to publish

## Required inputs

Ask the user for any missing item before starting:

1. **Source markdown file path** (absolute path inside the user's Obsidian vault)
2. **Attachment folder** — where Obsidian saves images relative to the note. If unsure, ask. Common patterns:
   - Same folder as the note
   - A subfolder named after the note (Obsidian "Same folder as note" setting)
   - A central `attachments/` or `_assets/` folder at vault root

Do not assume — if not specified, ask.

## Blog schema reference

Every post needs this frontmatter (`src/content.config.ts`):

```yaml
---
title: string                    # required
description: string              # required (one or two sentences)
image: "/images/blog/..."        # optional (card thumbnail + OG)
pubDate: YYYY-MM-DD              # required
category: <enum>                 # required, one of:
                                 #   algorithm, language-note, backend, ai,
                                 #   infra, frontend, essay
tags: [string, ...]              # optional, lowercase kebab-case preferred
draft: boolean                   # default false
pinned: boolean                  # default false — only for site-wide notices
slug: kebab-case-string          # required, matches URL /blog/<slug>/
---
```

Existing tag style: check `src/content/blog/*.md` frontmatter to keep tag spellings consistent (e.g., prefer `spring-boot` over `springboot`).

## Workflow

### 1. Parse the source file

Read the source `.md`. Extract its YAML frontmatter (Obsidian Properties write standard YAML).

If the source uses Obsidian-only fields (`aliases`, `cssclass`, etc.) that don't map to the blog schema, drop them.

### 2. Determine the slug

Priority order:
1. `slug` field in frontmatter (if present and kebab-case)
2. Filename stem if it is already kebab-case
3. Ask the user to provide one — do not auto-romanize Korean titles

The slug controls the final filename (`src/content/blog/<slug>.md`) and the image folder (`public/images/blog/<slug>/`). If a post with that slug already exists, confirm overwrite with the user before continuing.

### 3. Validate / fill required frontmatter

For each required field, in order:
- **title**: required. If missing, ask.
- **description**: required. If missing, propose one based on the first paragraph and confirm with user before using.
- **pubDate**: if missing, use today (the date from the environment context). Convert any non-ISO format to `YYYY-MM-DD`.
- **category**: required. If missing or invalid, present the 7 options and ask the user to choose. Do not guess silently.
- **tags**: default `[]`. Lowercase. Reuse existing tag spellings where possible.
- **draft**: if missing, default `false` (publish-ready). Ask if unsure.
- **pinned**: never set to `true` unless the user explicitly asks. This is for site-wide notices.

### 4. Find image references

Scan the body for both forms:

1. **Obsidian wikilink images**: `![[filename.png]]` or `![[filename.png|alt text]]` or `![[filename.png|400]]` (size hint)
2. **Standard markdown images**: `![alt](path/to/file.png)` where the path is relative to the note or to the vault root

For each reference, locate the actual file:
- First try: `<note_dir>/<filename>`
- Then: `<attachment_folder>/<filename>` (the folder the user specified)
- Then: walk the vault root looking for the filename (warn if multiple matches)

If a file cannot be located, list it to the user and ask how to proceed — do not silently drop the image.

### 5. Copy and rewrite images

For each located image:

1. Copy from source to `public/images/blog/<slug>/<original-filename>`
   - Create the folder if it doesn't exist
   - If a filename collision occurs with a different file, append a short hash suffix
2. Rewrite the reference in the markdown body to standard Astro form:
   - `![[foo.png]]` → `![](/images/blog/<slug>/foo.png)`
   - `![[foo.png|nice alt]]` → `![nice alt](/images/blog/<slug>/foo.png)`
   - `![[foo.png|400]]` → `![](/images/blog/<slug>/foo.png)` (drop size hint — blog has no Obsidian-style sizing)
   - `![alt](attachments/foo.png)` → `![alt](/images/blog/<slug>/foo.png)`

Preserve image filenames where reasonable. If filenames are non-ASCII or have spaces, normalize to kebab-case ASCII and update references accordingly.

### 6. Handle the thumbnail

If the user did not set `image:` in frontmatter and the first image reference in the body is a clean, on-topic figure, ask if it should be used as the card thumbnail. If yes, set `image: "/images/blog/<slug>/<that-file>"` in frontmatter.

### 7. Clean up Obsidian-only syntax

The blog uses standard CommonMark + MDX. Translate or warn about:

- **Internal wikilinks** `[[Some Note]]` (non-image): convert to plain bold text or remove, after asking the user. Do not invent blog URLs.
- **Callouts** `> [!note]` → convert to a regular blockquote `>` with the heading text bolded on the first line. Warn the user that callout styling is lost.
- **Embeds** `![[some-other-note]]` (non-image): not supported. Warn and ask.
- **Comments** `%% ... %%`: strip silently.
- **Highlight syntax** `==text==`: convert to `<mark>text</mark>` only if needed; otherwise leave the markdown source as-is (most markdown renderers don't highlight it, but it's harmless).
- **Tags inside body** like `#some-tag` written as Obsidian tags: leave the literal text alone; tags belong in frontmatter.

### 8. Code blocks

Ensure every fenced code block has a language hint (` ```ts `, ` ```bash `, etc.). If a block is missing one, infer from content where obvious (e.g., starts with `import`, `npm`, `<script>`); otherwise leave bare. Don't invent languages.

### 9. Write the output

Write the normalized file to `src/content/blog/<slug>.md`. Use the existing posts in `src/content/blog/` as a style reference for spacing and frontmatter ordering. Frontmatter field order (match existing convention):

```
title, description, image (if set), pubDate, category, tags, pinned (only if true), draft, slug
```

### 10. Verify

Run `npm run build`. If the build fails, the most common causes are:
- Invalid `category` value
- `slug` not in kebab-case
- `image:` path not starting with `/images/blog/`
- Broken image reference (file missing)

Fix issues found in the build output before considering the import done.

### 11. Report

Tell the user:
- Final path of the new post (`src/content/blog/<slug>.md`)
- Live URL it will have after deploy (`/blog/<slug>/`)
- Number of images copied and their destination folder
- Any callouts/wikilinks that were degraded with a brief note
- Whether `draft` is true or false

Do **not** commit or push unless the user explicitly asks. The user typically reviews the rendered output locally (`npm run dev`) first.

## Things to avoid

- Don't romanize Korean filenames or titles silently — ask the user
- Don't set `pinned: true` unless asked
- Don't rewrite the user's prose (typos, phrasing) unless asked
- Don't move or delete the original Obsidian source file
- Don't `git add` or `git commit` without explicit instruction
- Don't invent `description` or `tags` without confirmation
