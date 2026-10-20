import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/index.js';

export interface IEmbeddingProvider {
  embedText(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
  getDimension(): number;
}

export class GeminiEmbeddingProvider implements IEmbeddingProvider {
  private genAI: GoogleGenerativeAI;
  private modelName: string;
  private dimension: number;

  constructor() {
    if (!config.aiApiKey) {
      throw new Error(
        'Gemini API key is missing. Set AI_API_KEY in environment or configure AI_PROVIDER=mock for offline testing.'
      );
    }
    this.genAI = new GoogleGenerativeAI(config.aiApiKey);
    this.modelName = config.aiEmbeddingModel;
    this.dimension = config.aiEmbeddingDimension;
  }

  getDimension(): number {
    return this.dimension;
  }

  async embedText(text: string): Promise<number[]> {
    const model = this.genAI.getGenerativeModel({ model: this.modelName });
    const result = await model.embedContent(text);
    const embedding = result.embedding.values;

    if (!embedding || embedding.length !== this.dimension) {
      throw new Error(
        `Embedding dimension mismatch: expected ${this.dimension}, got ${embedding?.length}`
      );
    }

    return embedding;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const results: number[][] = [];
    const model = this.genAI.getGenerativeModel({ model: this.modelName });

    // Process in batches of 20 to avoid exceeding rate limits
    const batchSize = 20;
    for (let i = 0; i < texts.length; i += batchSize) {
      const slice = texts.slice(i, i + batchSize);
      const batchPromises = slice.map((t) => model.embedContent(t));
      const batchRes = await Promise.all(batchPromises);

      for (const res of batchRes) {
        if (!res.embedding.values || res.embedding.values.length !== this.dimension) {
          throw new Error('Batch embedding dimension mismatch');
        }
        results.push(res.embedding.values);
      }
    }

    return results;
  }
}

/**
 * Deterministic Mock Embedding Provider for isolated testing and offline environments.
 * Uses a deterministic hash projection to generate vectors of the required dimension.
 */
export class MockEmbeddingProvider implements IEmbeddingProvider {
  private dimension: number;

  constructor(dimension = 768) {
    this.dimension = dimension;
  }

  getDimension(): number {
    return this.dimension;
  }

  async embedText(text: string): Promise<number[]> {
    const vector = new Array(this.dimension).fill(0);
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      vector[i % this.dimension] += (code / 255.0) * (i % 2 === 0 ? 1 : -1);
    }

    // Normalize to unit vector
    let norm = Math.sqrt(vector.reduce((acc, val) => acc + val * val, 0));
    if (norm === 0) norm = 1;
    return vector.map((v) => v / norm);
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map((t) => this.embedText(t)));
  }
}

export function getEmbeddingProvider(): IEmbeddingProvider {
  if (config.aiProvider === 'mock' || !config.aiApiKey) {
    return new MockEmbeddingProvider(config.aiEmbeddingDimension);
  }
  return new GeminiEmbeddingProvider();
}
