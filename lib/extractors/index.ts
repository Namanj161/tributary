import { SourceType, ExtractionResult } from '@/types';
import { extractYouTube } from './youtube';
import { extractArticle } from './article';

export function detectSourceType(input: string): { type: SourceType; isUrl: boolean } {
  const trimmed = input.trim();

  // YouTube
  if (
    trimmed.includes('youtube.com/watch') ||
    trimmed.includes('youtu.be/') ||
    trimmed.includes('youtube.com/shorts/')
  ) {
    return { type: 'youtube', isUrl: true };
  }

  // Twitter/X
  if (
    trimmed.includes('twitter.com/') ||
    trimmed.includes('x.com/')
  ) {
    return { type: 'twitter_thread', isUrl: true };
  }

  // General URL (blog/article)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return { type: 'blog_post', isUrl: true };
  }

  // Raw text
  return { type: 'raw_text', isUrl: false };
}

export async function extractContent(input: string): Promise<ExtractionResult> {
  const { type, isUrl } = detectSourceType(input);

  if (!isUrl) {
    // Raw text — just pass it through
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
      // Twitter extraction is complex — for Phase 0, we'll ask for manual paste
      throw new Error(
        'Twitter/X thread extraction coming in Phase 1. For now, copy-paste the thread text directly.'
      );

    case 'blog_post':
    case 'article':
      return await extractArticle(input);

    default:
      throw new Error(`Unsupported source type: ${type}`);
  }
}
