import * as cheerio from 'cheerio';
import { ExtractionResult } from '@/types';

export async function extractArticle(url: string): Promise<ExtractionResult> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch article: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // Remove noise elements
  $('script, style, nav, footer, header, aside, .comments, .sidebar, .ad, .advertisement, .social-share, .related-posts, [role="navigation"], [role="banner"]').remove();

  // Extract title
  const title =
    $('meta[property="og:title"]').attr('content') ||
    $('h1').first().text().trim() ||
    $('title').text().trim() ||
    'Untitled Article';

  // Extract author
  const author =
    $('meta[name="author"]').attr('content') ||
    $('meta[property="article:author"]').attr('content') ||
    $('[rel="author"]').first().text().trim() ||
    $('[class*="author"]').first().text().trim() ||
    null;

  // Extract date
  const datePublished =
    $('meta[property="article:published_time"]').attr('content') ||
    $('meta[name="date"]').attr('content') ||
    $('time').first().attr('datetime') ||
    null;

  // Extract main content — try common article containers first
  let text = '';
  const articleSelectors = [
    'article',
    '[role="main"]',
    '.post-content',
    '.article-content',
    '.entry-content',
    '.post-body',
    'main',
    '.content',
  ];

  for (const selector of articleSelectors) {
    const el = $(selector);
    if (el.length && el.text().trim().length > 200) {
      text = el.text().trim();
      break;
    }
  }

  // Fallback: get all paragraph text from body
  if (!text) {
    text = $('p')
      .map((_, el) => $(el).text().trim())
      .get()
      .filter((p) => p.length > 30)
      .join('\n\n');
  }

  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();

  if (!text || text.length < 100) {
    throw new Error(
      'Could not extract meaningful text from this URL. The page may be behind a paywall or use JavaScript rendering. Try pasting the text directly.'
    );
  }

  return {
    type: 'blog_post',
    title,
    author,
    text,
    url,
    date_published: datePublished,
  };
}
