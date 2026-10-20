import { ExtractedPage } from './text-extractor.service.js';

export interface Chunk {
  chunkIndex: number;
  pageNumber: number | null;
  text: string;
}

export class TextChunker {
  /**
   * Splits document pages into overlapping chunks while preserving page provenance.
   * Uses sentence and paragraph boundary awareness where possible.
   */
  static chunkDocument(
    pages: ExtractedPage[],
    chunkSize = 800,
    chunkOverlap = 150
  ): Chunk[] {
    const chunks: Chunk[] = [];
    let currentChunkIndex = 0;

    for (const page of pages) {
      const pageChunks = this.chunkText(page.text, chunkSize, chunkOverlap);
      for (const text of pageChunks) {
        chunks.push({
          chunkIndex: currentChunkIndex++,
          pageNumber: page.pageNumber,
          text,
        });
      }
    }

    return chunks;
  }

  /**
   * Chunks a continuous text string into overlapping windows respecting boundary delimiters.
   */
  static chunkText(text: string, chunkSize = 800, chunkOverlap = 150): string[] {
    if (!text || text.trim().length === 0) return [];
    if (text.length <= chunkSize) return [text.trim()];

    const chunks: string[] = [];
    let startIndex = 0;

    while (startIndex < text.length) {
      let endIndex = startIndex + chunkSize;

      if (endIndex >= text.length) {
        const remaining = text.substring(startIndex).trim();
        if (remaining.length > 0) {
          chunks.push(remaining);
        }
        break;
      }

      // Try to break at a paragraph or sentence boundary near the target chunkSize
      let naturalBreak = -1;
      const lookbackZone = text.substring(startIndex + Math.floor(chunkSize * 0.7), endIndex);
      
      const lastParagraph = lookbackZone.lastIndexOf('\n\n');
      if (lastParagraph !== -1) {
        naturalBreak = startIndex + Math.floor(chunkSize * 0.7) + lastParagraph + 2;
      } else {
        const lastSentence = lookbackZone.search(/([.?!])\s+[A-Z0-9]/);
        if (lastSentence !== -1) {
          naturalBreak = startIndex + Math.floor(chunkSize * 0.7) + lastSentence + 2;
        } else {
          const lastSpace = lookbackZone.lastIndexOf(' ');
          if (lastSpace !== -1) {
            naturalBreak = startIndex + Math.floor(chunkSize * 0.7) + lastSpace + 1;
          }
        }
      }

      const finalCut = naturalBreak !== -1 ? naturalBreak : endIndex;
      const chunkStr = text.substring(startIndex, finalCut).trim();

      if (chunkStr.length > 0) {
        chunks.push(chunkStr);
      }

      // Step forward with overlap
      startIndex = Math.max(startIndex + 1, finalCut - chunkOverlap);
    }

    return chunks;
  }
}
