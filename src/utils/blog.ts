import { getCollection, type CollectionEntry } from 'astro:content';

export type BlogPost = CollectionEntry<'blog'>;

export async function getPublishedPosts() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);

  return posts.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}

export function getPinnedPosts(posts: BlogPost[]) {
  return posts.filter((post) => post.data.pinned);
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function getAllTags(posts: BlogPost[]) {
  return Array.from(new Set(posts.flatMap((post) => post.data.tags))).sort((a, b) =>
    a.localeCompare(b, 'ko-KR'),
  );
}

export function getPostsByTag(posts: BlogPost[], tag: string) {
  return posts.filter((post) => post.data.tags.includes(tag));
}

export function getPostUrl(post: BlogPost) {
  return `/blog/${post.data.slug}/`;
}

export const CATEGORIES = [
  { slug: 'algorithm', label: '알고리즘', description: '백준 등 문제풀이 기록' },
  { slug: 'language-note', label: '언어 노트', description: 'Java/Python 자료구조·문법 정리' },
  { slug: 'backend', label: '백엔드', description: 'Spring, JPA, 인증, 아키텍처' },
  { slug: 'ai', label: 'AI / LLM', description: 'Spring AI, RAG, Claude/Codex 활용기' },
  { slug: 'infra', label: '인프라 / 배포', description: 'AWS, Docker, Cloudflare, 성능' },
  { slug: 'frontend', label: '프론트엔드', description: 'React, 포트폴리오 웹사이트' },
  { slug: 'cs', label: 'CS', description: '자료구조, 알고리즘, 운영체제 등 컴퓨터 과학 기초' },
  { slug: 'essay', label: '회고 · 생각', description: '프로젝트 회고, 개발 문화, 메타' },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]['slug'];

export function getCategoryMeta(slug: CategorySlug) {
  return CATEGORIES.find((c) => c.slug === slug)!;
}

export function getPostsByCategory(posts: BlogPost[], slug: CategorySlug) {
  return posts.filter((post) => post.data.category === slug);
}

export function getCategoryUrl(slug: CategorySlug) {
  return `/categories/${slug}/`;
}

export function getRelatedPosts(target: BlogPost, all: BlogPost[], limit = 3) {
  const targetTags = new Set(target.data.tags);
  const candidates = all
    .filter((post) => post.data.slug !== target.data.slug)
    .map((post) => {
      const sharedTags = post.data.tags.filter((tag) => targetTags.has(tag)).length;
      const sameCategory = post.data.category === target.data.category ? 1 : 0;
      const score = sharedTags * 2 + sameCategory;
      return { post, score };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.post.data.pubDate.getTime() - a.post.data.pubDate.getTime();
    });

  const related = candidates.filter((c) => c.score > 0).slice(0, limit);
  if (related.length >= limit) return related.map((c) => c.post);

  const seen = new Set(related.map((c) => c.post.data.slug));
  const filler = candidates
    .filter((c) => !seen.has(c.post.data.slug))
    .slice(0, limit - related.length);
  return [...related, ...filler].map((c) => c.post);
}
