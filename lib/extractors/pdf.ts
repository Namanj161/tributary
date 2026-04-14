import { ExtractionResult } from '@/types';

export async function extractPDF(buffer: Buffer, fileName: string): Promise<ExtractionResult> {
  // Dynamic import to avoid issues with pdf-parse in edge runtime
  const pdfParse = (await import('pdf-parse')).default;

  const data = await pdfParse(buffer);

  const text = data.text
    .replace(/\s+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (!text || text.length < 50) {
    throw new Error('Could not extract meaningful text from this PDF. It may be image-based (scanned). Try OCR first or paste the text directly.');
  }

  const title = data.info?.Title || fileName.replace(/\.pdf$/i, '') || 'Untitled PDF';
  const author = data.info?.Author || null;

  return {
    type: 'pdf',
    title,
    author,
    text,
    url: '',
    date_published: data.info?.CreationDate || null,
  };
}
