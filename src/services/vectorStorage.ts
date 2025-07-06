
import { supabase } from '@/integrations/supabase/client';

export interface VectorDocument {
  id: string;
  content: string;
  embedding: number[];
  metadata: {
    version: string;
    product?: string;
    created_at: string;
    changelog_id: number;
  };
}

class VectorStorage {
  async storeDocument(document: VectorDocument): Promise<void> {
    try {
      const { error } = await supabase
        .from('changelog_embeddings')
        .upsert({
          id: document.id,
          content: document.content,
          embedding: document.embedding,
          version: document.metadata.version,
          product: document.metadata.product,
          created_at: document.metadata.created_at,
          changelog_id: document.metadata.changelog_id
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to store document:', error);
      throw error;
    }
  }

  async getAllDocuments(): Promise<VectorDocument[]> {
    try {
      const { data, error } = await supabase
        .from('changelog_embeddings')
        .select('*');

      if (error) throw error;

      return (data || []).map(row => ({
        id: row.id,
        content: row.content,
        embedding: row.embedding,
        metadata: {
          version: row.version,
          product: row.product,
          created_at: row.created_at,
          changelog_id: row.changelog_id
        }
      }));
    } catch (error) {
      console.error('Failed to get all documents:', error);
      throw error;
    }
  }

  async deleteDocument(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('changelog_embeddings')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to delete document:', error);
      throw error;
    }
  }

  async deleteByChangelogId(changelogId: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('changelog_embeddings')
        .delete()
        .eq('changelog_id', changelogId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to delete documents by changelog ID:', error);
      throw error;
    }
  }

  cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async search(queryEmbedding: number[], limit: number = 5): Promise<Array<VectorDocument & { similarity: number }>> {
    try {
      // For now, we'll do similarity search in the client
      // In production, you'd want to use pgvector's similarity functions
      const documents = await this.getAllDocuments();
      
      const results = documents.map(doc => ({
        ...doc,
        similarity: this.cosineSimilarity(queryEmbedding, doc.embedding)
      }));

      return results
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to search documents:', error);
      throw error;
    }
  }

  // Method to use pgvector similarity search (requires proper SQL function)
  async searchWithPgVector(queryEmbedding: number[], limit: number = 5): Promise<Array<VectorDocument & { similarity: number }>> {
    try {
      const { data, error } = await supabase
        .rpc('search_similar_changelogs', {
          query_embedding: queryEmbedding,
          match_threshold: 0.7,
          match_count: limit
        });

      if (error) throw error;

      return (data || []).map(row => ({
        id: row.id,
        content: row.content,
        embedding: row.embedding,
        metadata: {
          version: row.version,
          product: row.product,
          created_at: row.created_at,
          changelog_id: row.changelog_id
        },
        similarity: row.similarity
      }));
    } catch (error) {
      console.error('Failed to search with pgvector:', error);
      // Fallback to client-side search
      return this.search(queryEmbedding, limit);
    }
  }
}

export const vectorStorage = new VectorStorage();
