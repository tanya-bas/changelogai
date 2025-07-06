
import { pipeline, Pipeline } from '@huggingface/transformers';

class EmbeddingService {
  private static instance: EmbeddingService;
  private embeddingPipeline: Pipeline | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): EmbeddingService {
    if (!EmbeddingService.instance) {
      EmbeddingService.instance = new EmbeddingService();
    }
    return EmbeddingService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('Initializing embedding pipeline...');
      this.embeddingPipeline = await pipeline(
        'feature-extraction',
        'mixedbread-ai/mxbai-embed-xsmall-v1',
        { device: 'webgpu' }
      );
      this.isInitialized = true;
      console.log('Embedding pipeline initialized successfully');
    } catch (error) {
      console.error('Failed to initialize embedding pipeline:', error);
      throw error;
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.embeddingPipeline) {
      await this.initialize();
    }

    try {
      const result = await this.embeddingPipeline!(text, {
        pooling: 'mean',
        normalize: true
      });
      
      // Convert tensor to array
      return Array.from(result.data as Float32Array);
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      throw error;
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (!this.embeddingPipeline) {
      await this.initialize();
    }

    try {
      const result = await this.embeddingPipeline!(texts, {
        pooling: 'mean',
        normalize: true
      });
      
      // Convert tensor to array of arrays
      const embeddings: number[][] = [];
      const data = Array.from(result.data as Float32Array);
      const embeddingSize = data.length / texts.length;
      
      for (let i = 0; i < texts.length; i++) {
        const start = i * embeddingSize;
        const end = start + embeddingSize;
        embeddings.push(data.slice(start, end));
      }
      
      return embeddings;
    } catch (error) {
      console.error('Failed to generate embeddings:', error);
      throw error;
    }
  }
}

export const embeddingService = EmbeddingService.getInstance();
