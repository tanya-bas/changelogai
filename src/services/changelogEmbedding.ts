
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

      console.log('Searchable text for embedding:', searchableText.substring(0, 200) + '...');

      const embedding = await embeddingService.generateEmbedding(searchableText);
      console.log('Generated embedding length:', embedding.length);
      console.log('First 5 embedding values:', embedding.slice(0, 5));

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
      console.log('=== SEMANTIC SEARCH DEBUG ===');
      console.log('Query:', query.substring(0, 200) + '...');
      
      const queryEmbedding = await embeddingService.generateEmbedding(query);
      console.log('Query embedding length:', queryEmbedding.length);
      console.log('Query embedding first 5 values:', queryEmbedding.slice(0, 5));
      
      // Get all embeddings from database
      const { data: embeddings, error } = await supabase
        .from('changelog_embeddings')
        .select('*');

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      if (!embeddings || embeddings.length === 0) {
        console.log('No embeddings found in database');
        return [];
      }

      console.log(`Found ${embeddings.length} embeddings in database`);

      // Debug first embedding
      if (embeddings.length > 0) {
        const firstEmbedding = embeddings[0];
        console.log('First embedding ID:', firstEmbedding.id);
        console.log('First embedding content preview:', firstEmbedding.content?.substring(0, 100) + '...');
        console.log('First embedding vector length:', firstEmbedding.embedding?.length);
        console.log('First embedding vector first 5 values:', firstEmbedding.embedding?.slice(0, 5));
        
        // Check if embedding is stored as array or needs parsing
        console.log('Embedding type:', typeof firstEmbedding.embedding);
        console.log('Is array?', Array.isArray(firstEmbedding.embedding));
      }

      // Calculate cosine similarity for each embedding
      const results = embeddings.map((item, index) => {
        console.log(`\n--- Processing embedding ${index + 1}/${embeddings.length} ---`);
        console.log('Item ID:', item.id);
        console.log('Item content preview:', item.content?.substring(0, 50) + '...');
        
        let embeddingVector = item.embedding;
        
        // Handle potential JSON string storage
        if (typeof embeddingVector === 'string') {
          try {
            embeddingVector = JSON.parse(embeddingVector);
            console.log('Parsed embedding from JSON string');
          } catch (e) {
            console.error('Failed to parse embedding JSON:', e);
            return { ...item, similarity: 0 };
          }
        }
        
        if (!Array.isArray(embeddingVector)) {
          console.error('Embedding is not an array:', typeof embeddingVector);
          return { ...item, similarity: 0 };
        }
        
        console.log('Embedding vector length:', embeddingVector.length);
        console.log('Query vector length:', queryEmbedding.length);
        
        if (embeddingVector.length !== queryEmbedding.length) {
          console.error('Vector length mismatch!');
          return { ...item, similarity: 0 };
        }
        
        const similarity = this.debugCosineSimilarity(queryEmbedding, embeddingVector, item.id);
        console.log(`Final similarity for ${item.id}: ${similarity}`);
        
        return {
          ...item,
          similarity: similarity
        };
      }).filter(item => {
        const isValid = !isNaN(item.similarity) && isFinite(item.similarity);
        if (!isValid) {
          console.log(`Filtering out invalid similarity for ${item.id}: ${item.similarity}`);
        }
        return isValid;
      });

      console.log('\n=== SIMILARITY RESULTS ===');
      results.forEach(r => {
        console.log(`${r.id}: ${r.similarity}`);
      });

      // Sort by similarity and return top results
      const filteredResults = results
        .filter(item => {
          const passes = item.similarity > 0.1;
          console.log(`${item.id} passes threshold (>0.1): ${passes} (similarity: ${item.similarity})`);
          return passes;
        })
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

      console.log(`\nReturning ${filteredResults.length} results:`, 
        filteredResults.map(r => ({ id: r.id, similarity: r.similarity })));

      return filteredResults;
    } catch (error) {
      console.error('Failed to search similar changelogs:', error);
      return [];
    }
  }

  private debugCosineSimilarity(a: number[], b: number[], itemId: string): number {
    console.log(`Computing cosine similarity for ${itemId}`);
    
    if (!a || !b || a.length !== b.length) {
      console.warn(`Invalid vectors for ${itemId}: a=${a?.length}, b=${b?.length}`);
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    // Check for NaN values in first few elements
    for (let i = 0; i < Math.min(5, a.length); i++) {
      if (isNaN(a[i]) || isNaN(b[i])) {
        console.warn(`NaN detected at index ${i} for ${itemId}: a[${i}]=${a[i]}, b[${i}]=${b[i]}`);
      }
    }

    for (let i = 0; i < a.length; i++) {
      if (isNaN(a[i]) || isNaN(b[i])) {
        console.warn(`NaN values detected in embeddings for ${itemId} at index ${i}`);
        return 0;
      }
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    console.log(`${itemId} - dotProduct: ${dotProduct}, normA: ${normA}, normB: ${normB}`);

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) {
      console.warn(`Zero denominator in cosine similarity for ${itemId}`);
      return 0;
    }

    const similarity = dotProduct / denominator;
    const finalSimilarity = isNaN(similarity) ? 0 : similarity;
    
    console.log(`${itemId} - raw similarity: ${similarity}, final: ${finalSimilarity}`);
    return finalSimilarity;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (!a || !b || a.length !== b.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      if (isNaN(a[i]) || isNaN(b[i])) {
        return 0;
      }
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) {
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
