import fs from 'fs';
import pdfParse from 'pdf-parse';

export interface ExtractedPage {
  pageNumber: number;
  text: string;
}

export interface ExtractedDocument {
  text: string;
  pages: ExtractedPage[];
  totalPages: number;
}

export class TextExtractor {
  static async extract(filePath: string, mimeType: string): Promise<ExtractedDocument> {
    const fileBuffer = await fs.promises.readFile(filePath);

    if (mimeType === 'text/plain' || filePath.endsWith('.txt')) {
      const text = fileBuffer.toString('utf-8').trim();
      if (!text) {
        throw new Error('Text document is empty or contains no readable characters.');
      }
      return {
        text,
        pages: [{ pageNumber: 1, text }],
        totalPages: 1,
      };
    }

    if (mimeType === 'application/pdf' || filePath.endsWith('.pdf')) {
      const pages: ExtractedPage[] = [];

      // Custom pager to preserve page numbers
      const options = {
        pagerender: function (pageData: any) {
          return pageData.getTextContent().then(function (textContent: any) {
            let lastY: number | null = null;
            let text = '';
            for (const item of textContent.items) {
              if (lastY == null || Math.abs(item.transform[5] - lastY) > 5) {
                text += '\n' + item.str;
              } else {
                text += ' ' + item.str;
              }
              lastY = item.transform[5];
            }
            pages.push({
              pageNumber: pageData.pageIndex + 1,
              text: text.trim(),
            });
            return text;
          });
        },
      };

      const parsed = await pdfParse(fileBuffer, options);
      const combinedText = parsed.text.trim();

      if (!combinedText) {
        throw new Error(
          'Scanned or empty PDF detected: No extractable text found. Optical Character Recognition (OCR) is required for scanned image PDFs.'
        );
      }

      // Sort pages by page number
      pages.sort((a, b) => a.pageNumber - b.pageNumber);

      return {
        text: combinedText,
        pages,
        totalPages: parsed.numpages || pages.length || 1,
      };
    }

    throw new Error(`Unsupported MIME type: ${mimeType}. Only PDF and TXT files are supported.`);
  }

  /**
   * Normalizes text by removing excessive control characters and repeated whitespace,
   * while preserving structural paragraphs and punctuation.
   */
  static normalizeText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/[\t ]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}
