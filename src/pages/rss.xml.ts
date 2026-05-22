import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPostUrl, getPublishedPosts } from '@/utils/blog';

const defaultImage = '/images/blog/og-default.svg';

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export async function GET(context: APIContext) {
  const posts = await getPublishedPosts();
  const site = context.site ?? 'https://blog.rlarbdlf222.workers.dev';

  return rss({
    title: '개발 노트',
    description: '코드, 운영, 배포 경험을 정리하는 한국어 개발자 블로그',
    site,
    xmlns: {
      media: 'http://search.yahoo.com/mrss/',
    },
    items: posts.map((post) => {
      const image = new URL(post.data.image ?? defaultImage, site).toString();

      return {
        title: post.data.title,
        description: post.data.description,
        pubDate: post.data.pubDate,
        link: getPostUrl(post),
        categories: post.data.tags,
        customData: `<media:thumbnail url="${escapeXml(image)}" />`,
      };
    }),
  });
}
