
import { pipeline } from '@huggingface/transformers';

class EmbeddingService {
  private static instance: EmbeddingService;
  private embeddingPipeline: any = null;

  private constructor() {}

  static getInstance(): EmbeddingService {
    if (!EmbeddingService.instance) {
      EmbeddingService.instance = new EmbeddingService();
    }
    return EmbeddingService.instance;
  }

  private async initializePipeline() {
    if (!this.embeddingPipeline) {
      console.log('Initializing local embedding model...');
      this.embeddingPipeline = await pipeline('feature-extraction', 'Supabase/gte-small');
      console.log('Local embedding model initialized successfully');
    }
    return this.embeddingPipeline;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      console.log('Generating embedding with local model...');
      
      const generateEmbedding = await this.initializePipeline();
      
      // Generate a vector using Transformers.js
      const output = await generateEmbedding(text, {
        pooling: 'mean',
        normalize: true,
      });
      
      // Extract the embedding output and ensure it's typed as number[]
      const embedding = Array.from(output.data) as number[];
      
      console.log('Local embedding generated successfully');
      return embedding;
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      throw error;
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      console.log(`Generating ${texts.length} embeddings with local model...`);
      
      const results: number[][] = [];
      
      for (const text of texts) {
        const embedding = await this.generateEmbedding(text);
        results.push(embedding);
      }
      
      console.log('Local embeddings generated successfully');
      return results;
    } catch (error) {
      console.error('Failed to generate embeddings:', error);
      throw error;
    }
  }
}

export const embeddingService = EmbeddingService.getInstance();
