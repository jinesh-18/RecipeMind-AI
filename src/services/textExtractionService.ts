/**
 * Text Extraction Service
 * Extracts text content from uploaded documents (TXT, DOCX).
 * PDF extraction requires a server-side library — currently returns placeholder for PDFs.
 */

export interface ExtractionResult {
  text: string;
  success: boolean;
  error?: string;
}

export async function extractTextFromFile(file: File): Promise<ExtractionResult> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  try {
    if (extension === 'txt') {
      const text = await file.text();
      return { text, success: true };
    }

    if (extension === 'docx') {
      return await extractFromDocx(file);
    }

    if (extension === 'pdf') {
      // PDF extraction requires a server-side library or pdfjs
      // For the MVP, we return the filename as context and prompt users to use TXT/DOCX
      return {
        text: `[PDF Document: ${file.name}]\nPDF text extraction requires server-side processing. Document metadata stored. For full text search, please re-upload as a .txt file.\n`,
        success: true,
      };
    }

    return { text: '', success: false, error: `Unsupported file type: .${extension}` };
  } catch (err) {
    return { text: '', success: false, error: `Failed to extract text: ${(err as Error).message}` };
  }
}

async function extractFromDocx(file: File): Promise<ExtractionResult> {
  try {
    // mammoth is loaded dynamically to avoid bloating initial bundle
    const mammoth = await import('mammoth');
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return { text: result.value, success: true };
  } catch (err) {
    return {
      text: '',
      success: false,
      error: `DOCX extraction failed: ${(err as Error).message}`,
    };
  }
}

/**
 * Split text into overlapping chunks for retrieval
 */
export function chunkText(text: string, chunkSize = 500, overlap = 50): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];

  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    if (chunk.trim()) chunks.push(chunk.trim());
    if (i + chunkSize >= words.length) break;
  }

  return chunks.length > 0 ? chunks : [text.substring(0, 2000)];
}
