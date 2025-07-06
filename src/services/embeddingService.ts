
import { supabase } from '@/integrations/supabase/client';

class EmbeddingService {
  private static instance: EmbeddingService;

  private constructor() {}

  static getInstance(): EmbeddingService {
    if (!EmbeddingService.instance) {
      EmbeddingService.instance = new EmbeddingService();
    }
    return EmbeddingService.instance;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      console.log('Generating embedding with OpenAI...');
      
      const { data, error } = await supabase.functions.invoke('generate-embedding', {
        body: { text }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to generate embedding');
      }

      if (!data || !data.embedding) {
        throw new Error('No embedding returned from OpenAI service');
      }

      console.log('OpenAI embedding generated successfully');
      return data.embedding;
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      throw error;
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      console.log(`Generating ${texts.length} embeddings with OpenAI...`);
      
      const { data, error } = await supabase.functions.invoke('generate-embedding', {
        body: { texts }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to generate embeddings');
      }

      if (!data || !data.embeddings) {
        throw new Error('No embeddings returned from OpenAI service');
      }

      console.log('OpenAI embeddings generated successfully');
      return data.embeddings;
    } catch (error) {
      console.error('Failed to generate embeddings:', error);
      throw error;
    }
  }
}

export const embeddingService = EmbeddingService.getInstance();
