
import { embeddingService } from './embeddingService';
import { supabase } from '@/integrations/supabase/client';

interface ChangelogEntry {
  id: number;
  version: string;
  content: string;
  created_at: string;
  product?: string;
}

class ChangelogEmbeddingService {
  async embedChangelog(changelog: ChangelogEntry): Promise<void> {
    try {
      console.log(`Embedding changelog ${changelog.id}...`);
      
      // Create searchable text combining version, product, and content
      const searchableText = [
        `Version ${changelog.version}`,
        changelog.product ? `Product: ${changelog.product}` : '',
        changelog.content
      ].filter(Boolean).join('\n\n');

      const embedding = await embeddingService.generateEmbedding(searchableText);

      // Store the embedding in Supabase
      const { error } = await supabase
        .from('changelog_embeddings')
        .upsert({
          id: `changelog_${changelog.id}`,
          content: searchableText,
          embedding: embedding,
          version: changelog.version,
          product: changelog.product,
          created_at: changelog.created_at,
          changelog_id: changelog.id
        });

      if (error) {
        console.error('Failed to store embedding:', error);
        throw error;
      }

      console.log(`Successfully embedded changelog ${changelog.id}`);
    } catch (error) {
      console.error(`Failed to embed changelog ${changelog.id}:`, error);
      throw error;
    }
  }

  async searchSimilarChangelogs(query: string, limit: number = 3): Promise<any[]> {
    try {
      console.log('Searching similar changelogs...');
      const queryEmbedding = await embeddingService.generateEmbedding(query);
      
      // Simple approach: get all embeddings and calculate similarity client-side
      const { data: embeddings, error } = await supabase
        .from('changelog_embeddings')
        .select('*');

      if (error) throw error;

      if (!embeddings || embeddings.length === 0) {
        console.log('No embeddings found in database');
        return [];
      }

      console.log(`Found ${embeddings.length} embeddings to compare`);

      // Calculate cosine similarity for each embedding
      const results = embeddings.map(item => {
        const similarity = this.cosineSimilarity(queryEmbedding, item.embedding);
        console.log(`Changelog ${item.id}: similarity = ${similarity}`);
        return {
          ...item,
          similarity: similarity
        };
      }).filter(item => !isNaN(item.similarity) && isFinite(item.similarity));

      // Sort by similarity and return top results
      // Lower the threshold to 0.1 to be more inclusive
      const filteredResults = results
        .filter(item => item.similarity > 0.1)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

      console.log(`Returning ${filteredResults.length} results with similarities:`, 
        filteredResults.map(r => ({ id: r.id, similarity: r.similarity })));

      return filteredResults;
    } catch (error) {
      console.error('Failed to search similar changelogs:', error);
      return [];
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (!a || !b || a.length !== b.length) {
      console.warn('Invalid vectors for cosine similarity');
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      if (isNaN(a[i]) || isNaN(b[i])) {
        console.warn('NaN values detected in embeddings');
        return 0;
      }
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) {
      console.warn('Zero denominator in cosine similarity');
      return 0;
    }

    const similarity = dotProduct / denominator;
    return isNaN(similarity) ? 0 : similarity;
  }

  async deleteChangelogEmbedding(changelogId: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('changelog_embeddings')
        .delete()
        .eq('changelog_id', changelogId);
      
      if (error) throw error;
      console.log(`Deleted embedding for changelog ${changelogId}`);
    } catch (error) {
      console.error(`Failed to delete embedding for changelog ${changelogId}:`, error);
      throw error;
    }
  }
}

export const changelogEmbeddingService = new ChangelogEmbeddingService();
