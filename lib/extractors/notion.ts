import { ExtractionResult } from '@/types';

function extractPageId(input: string): string | null {
  // Handle full URLs: https://www.notion.so/Page-Title-abc123def456...
  const urlMatch = input.match(/notion\.so\/(?:.*-)?([a-f0-9]{32})/);
  if (urlMatch) return urlMatch[1];

  // Handle URLs with query params: https://notion.so/abc123?v=...
  const paramMatch = input.match(/notion\.so\/([a-f0-9]{32})/);
  if (paramMatch) return paramMatch[1];

  // Handle raw page IDs (with or without dashes)
  const rawId = input.replace(/-/g, '');
  if (/^[a-f0-9]{32}$/.test(rawId)) return rawId;

  return null;
}

function formatPageId(id: string): string {
  // Notion API expects UUID format: 8-4-4-4-12
  if (id.includes('-')) return id;
  return `${id.slice(0,8)}-${id.slice(8,12)}-${id.slice(12,16)}-${id.slice(16,20)}-${id.slice(20)}`;
}

function blocksToText(blocks: any[]): string {
  return blocks
    .map((block) => {
      const type = block.type;
      const data = block[type];
      if (!data) return '';

      // Extract rich text content
      if (data.rich_text) {
        const text = data.rich_text.map((rt: any) => rt.plain_text).join('');
        switch (type) {
          case 'heading_1': return `# ${text}`;
          case 'heading_2': return `## ${text}`;
          case 'heading_3': return `### ${text}`;
          case 'bulleted_list_item': return `- ${text}`;
          case 'numbered_list_item': return `- ${text}`;
          case 'to_do': return `- [${data.checked ? 'x' : ' '}] ${text}`;
          case 'toggle': return `> ${text}`;
          case 'quote': return `> ${text}`;
          case 'callout': return `> ${text}`;
          case 'code': return `\`\`\`\n${text}\n\`\`\``;
          default: return text;
        }
      }

      if (type === 'divider') return '---';
      if (type === 'equation' && data.expression) return data.expression;

      return '';
    })
    .filter(Boolean)
    .join('\n\n');
}

export async function extractNotion(url: string): Promise<ExtractionResult> {
  const apiKey = process.env.NOTION_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Notion API key not configured.\n\n' +
      'To set it up:\n' +
      '1. Go to notion.so/my-integrations\n' +
      '2. Create a new integration\n' +
      '3. Add NOTION_API_KEY=your_key to .env.local\n' +
      '4. Share the Notion page with your integration'
    );
  }

  const pageId = extractPageId(url);
  if (!pageId) throw new Error('Could not extract Notion page ID from URL');

  const formattedId = formatPageId(pageId);
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json',
  };

  // Fetch page metadata
  const pageResponse = await fetch(`https://api.notion.com/v1/pages/${formattedId}`, { headers });

  if (!pageResponse.ok) {
    const err = await pageResponse.text();
    if (pageResponse.status === 404) {
      throw new Error('Notion page not found. Make sure the page is shared with your integration.');
    }
    throw new Error(`Notion API error: ${pageResponse.status}`);
  }

  const page = await pageResponse.json();

  // Extract title from page properties
  let title = 'Untitled Notion Page';
  const titleProp = page.properties?.title || page.properties?.Name;
  if (titleProp?.title) {
    title = titleProp.title.map((t: any) => t.plain_text).join('') || title;
  }

  // Fetch all blocks (paginated)
  let allBlocks: any[] = [];
  let cursor: string | undefined;

  do {
    const blocksUrl = `https://api.notion.com/v1/blocks/${formattedId}/children?page_size=100${cursor ? `&start_cursor=${cursor}` : ''}`;
    const blocksResponse = await fetch(blocksUrl, { headers });

    if (!blocksResponse.ok) throw new Error('Failed to fetch Notion page blocks');

    const blocksData = await blocksResponse.json();
    allBlocks.push(...(blocksData.results || []));
    cursor = blocksData.has_more ? blocksData.next_cursor : undefined;
  } while (cursor);

  const text = blocksToText(allBlocks);

  if (!text || text.length < 20) {
    throw new Error('Notion page appears to be empty or contains only unsupported block types.');
  }

  return {
    type: 'notion_page',
    title,
    author: null,
    text,
    url,
    date_published: page.created_time || null,
  };
}
