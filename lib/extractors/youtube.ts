import { ExtractionResult } from '@/types';
import { YoutubeTranscript } from 'youtube-transcript';

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

async function fetchTitle(videoId: string): Promise<{ title: string; author: string | null }> {
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );
    if (response.ok) {
      const data = await response.json();
      return {
        title: data.title || 'Untitled Video',
        author: data.author_name || null,
      };
    }
  } catch (e) {
    // fallback
  }
  return { title: 'Untitled Video', author: null };
}

export async function extractYouTube(url: string): Promise<ExtractionResult> {
  const videoId = extractVideoId(url);
  if (!videoId) {
    throw new Error('Could not extract video ID from URL');
  }

  // Fetch title and transcript in parallel
  const [{ title, author }, transcriptSegments] = await Promise.all([
    fetchTitle(videoId),
    YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' }).catch(async () => {
      // Retry without language filter (some videos only have auto-generated captions)
      return YoutubeTranscript.fetchTranscript(videoId).catch(() => {
        throw new Error(
          'Could not fetch transcript for this video. The video may not have captions enabled.\n\n' +
          'Workaround: Open the video on YouTube → click "..." below the video → "Show transcript" → ' +
          'select all the transcript text → copy → paste directly into Tributary.'
        );
      });
    }),
  ]);

  // Combine all transcript segments into one text
  const transcript = transcriptSegments
    .map((segment) => segment.text)
    .join(' ')
    .replace(/\s+/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();

  if (!transcript) {
    throw new Error('Transcript was empty. Try pasting the transcript text directly.');
  }

  return {
    type: 'youtube',
    title,
    author,
    text: transcript,
    url,
    date_published: null,
  };
}
