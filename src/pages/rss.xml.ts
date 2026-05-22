import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPostUrl, getPublishedPosts } from '@/utils/blog';

export async function GET(context: APIContext) {
  const posts = await getPublishedPosts();

  return rss({
    title: '개발 노트',
    description: '코드, 운영, 배포 경험을 정리하는 한국어 개발자 블로그',
    site: context.site ?? 'https://blog.rlarbdlf222.workers.dev',
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: getPostUrl(post),
      categories: post.data.tags,
    })),
  });
}
