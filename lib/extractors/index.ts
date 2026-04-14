import { SourceType, ExtractionResult } from '@/types';
import { extractYouTube } from './youtube';
import { extractArticle } from './article';
import { extractTwitter } from './twitter';
import { extractNotion } from './notion';

export function detectSourceType(input: string): { type: SourceType; isUrl: boolean } {
  const trimmed = input.trim();

  if (
    trimmed.includes('youtube.com/watch') ||
    trimmed.includes('youtu.be/') ||
    trimmed.includes('youtube.com/shorts/')
  ) {
    return { type: 'youtube', isUrl: true };
  }

  if (trimmed.includes('twitter.com/') || trimmed.includes('x.com/')) {
    return { type: 'twitter_thread', isUrl: true };
  }

  if (trimmed.includes('notion.so/') || trimmed.includes('notion.site/')) {
    return { type: 'notion_page', isUrl: true };
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return { type: 'blog_post', isUrl: true };
  }

  return { type: 'raw_text', isUrl: false };
}

export async function extractContent(input: string): Promise<ExtractionResult> {
  const { type, isUrl } = detectSourceType(input);

  if (!isUrl) {
    return {
      type: 'raw_text',
      title: input.slice(0, 80).replace(/\n/g, ' ') + (input.length > 80 ? '...' : ''),
      author: null,
      text: input,
      url: '',
      date_published: null,
    };
  }

  switch (type) {
    case 'youtube':
      return await extractYouTube(input);

    case 'twitter_thread':
      return await extractTwitter(input);

    case 'notion_page':
      return await extractNotion(input);

    case 'blog_post':
    case 'article':
      return await extractArticle(input);

    default:
      throw new Error(`Unsupported source type: ${type}`);
  }
}
