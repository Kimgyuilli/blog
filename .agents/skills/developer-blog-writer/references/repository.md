# Repository output

The content schema is `src/content.config.ts`; consult it when saving a post because it is the source of truth for required fields and allowed categories. Use `src/content/blog/<slug>.md` by default. Use MDX only when the article actually needs a component.

- Required frontmatter: `title`, `description`, `pubDate`, `category`, `slug`. Include useful `tags`; set `draft: true` for a new review draft.
- Current categories describe **topics**, not writing types: `algorithm`, `language-note`, `backend`, `ai`, `infra`, `frontend`, `cs`, `essay`. Choose the closest topic independently of the type guide.
- Use a descriptive lowercase kebab-case slug. Check for an existing file or slug before creating a new post.
- Write a description that tells the reader what this particular article resolves. Do not use filler or repeat the title mechanically.
- Include `image` only when the referenced local image actually exists under `/images/blog/`.
- Use the user's specified publication date when supplied; otherwise use the current local date for the draft.
- When a file is created or edited, check its frontmatter against the schema and run the repository build if needed to catch content validation or rendering failures. A passing build does not prove the article's factual accuracy or voice.
