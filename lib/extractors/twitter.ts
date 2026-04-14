import { ExtractionResult } from '@/types';

function extractTweetInfo(url: string): { username: string; tweetId: string } | null {
  const match = url.match(/(?:twitter\.com|x\.com)\/(\w+)\/status\/(\d+)/);
  if (match) return { username: match[1], tweetId: match[2] };
  return null;
}

export async function extractTwitter(url: string): Promise<ExtractionResult> {
  const info = extractTweetInfo(url);
  if (!info) throw new Error('Could not extract tweet ID from URL');

  // Try FxTwitter API (free, no auth needed)
  const fxResponse = await fetch(`https://api.fxtwitter.com/${info.username}/status/${info.tweetId}`, {
    headers: { 'User-Agent': 'TributaryBot/1.0' },
  });

  if (fxResponse.ok) {
    const data = await fxResponse.json();
    const tweet = data?.tweet;

    if (tweet?.text) {
      // Check for thread/conversation
      let fullText = tweet.text;
      const author = tweet.author?.name || tweet.author?.screen_name || info.username;

      // If tweet has a quote tweet, append it
      if (tweet.quote?.text) {
        fullText += `\n\n[Quoted tweet from @${tweet.quote.author?.screen_name || 'unknown'}]:\n${tweet.quote.text}`;
      }

      return {
        type: 'twitter_thread',
        title: `Tweet by @${tweet.author?.screen_name || info.username}`,
        author: author,
        text: fullText,
        url,
        date_published: tweet.created_at || null,
      };
    }
  }

  // Fallback: try oEmbed API
  const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&omit_script=true`;
  const oembedResponse = await fetch(oembedUrl);

  if (oembedResponse.ok) {
    const data = await oembedResponse.json();
    // Strip HTML from oEmbed response
    const text = (data.html || '')
      .replace(/<[^>]*>/g, '')
      .replace(/&mdash;/g, '—')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();

    if (text.length > 20) {
      return {
        type: 'twitter_thread',
        title: `Tweet by ${data.author_name || info.username}`,
        author: data.author_name || null,
        text,
        url,
        date_published: null,
      };
    }
  }

  throw new Error(
    'Could not extract this tweet. It may be from a private account or deleted.\n\n' +
    'Workaround: Copy the tweet text and paste it directly into TPIC.'
  );
}
