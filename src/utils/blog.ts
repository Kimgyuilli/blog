import { getCollection, type CollectionEntry } from 'astro:content';

export type BlogPost = CollectionEntry<'blog'>;

export async function getPublishedPosts() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);

  return posts.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
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
