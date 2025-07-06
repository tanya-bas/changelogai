
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
      console.log('=== SEMANTIC SEARCH DEBUG START ===');
      console.log('Query received:', query.substring(0, 200) + '...');
      console.log('Query length:', query.length);
      
      // CRITICAL: Generate embedding for the query
      console.log('🔄 Starting query embedding generation...');
      const queryEmbedding = await embeddingService.generateEmbedding(query);
      console.log('✅ Query embedding generated successfully!');
      console.log('Query embedding length:', queryEmbedding.length);
      console.log('Query embedding first 5 values:', queryEmbedding.slice(0, 5));
      console.log('Query embedding stats - min:', Math.min(...queryEmbedding), 'max:', Math.max(...queryEmbedding));
      
      // Check for NaN values in query embedding
      const queryNanCount = queryEmbedding.filter(v => isNaN(v)).length;
      if (queryNanCount > 0) {
        console.error(`❌ Found ${queryNanCount} NaN values in QUERY embedding!`);
        return [];
      }
      
      console.log('🔄 Fetching stored embeddings from database...');
      // Get all embeddings from database
      const { data: embeddings, error } = await supabase
        .from('changelog_embeddings')
        .select('*');

      if (error) {
        console.error('❌ Database error:', error);
        throw error;
      }

      if (!embeddings || embeddings.length === 0) {
        console.log('⚠️ No embeddings found in database');
        return [];
      }

      console.log(`✅ Found ${embeddings.length} stored embeddings in database`);

      // Debug first stored embedding
      if (embeddings.length > 0) {
        const firstEmbedding = embeddings[0];
        console.log('--- First stored embedding debug ---');
        console.log('ID:', firstEmbedding.id);
        console.log('Content preview:', firstEmbedding.content?.substring(0, 100) + '...');
        console.log('Embedding vector length:', firstEmbedding.embedding?.length);
        console.log('Embedding vector first 5 values:', firstEmbedding.embedding?.slice(0, 5));
        console.log('Embedding type:', typeof firstEmbedding.embedding);
        console.log('Is array?', Array.isArray(firstEmbedding.embedding));
      }

      console.log('🔄 Starting similarity calculations...');
      // Calculate cosine similarity for each embedding
      const results = embeddings.map((item, index) => {
        console.log(`\n--- Processing embedding ${index + 1}/${embeddings.length} (${item.id}) ---`);
        
        let embeddingVector = item.embedding;
        
        // Handle potential JSON string storage
        if (typeof embeddingVector === 'string') {
          try {
            embeddingVector = JSON.parse(embeddingVector);
            console.log('✅ Parsed embedding from JSON string');
          } catch (e) {
            console.error('❌ Failed to parse embedding JSON:', e);
            return { ...item, similarity: 0 };
          }
        }
        
        if (!Array.isArray(embeddingVector)) {
          console.error('❌ Embedding is not an array:', typeof embeddingVector);
          return { ...item, similarity: 0 };
        }
        
        console.log('Stored embedding vector length:', embeddingVector.length);
        console.log('Query embedding vector length:', queryEmbedding.length);
        
        if (embeddingVector.length !== queryEmbedding.length) {
          console.error('❌ Vector length mismatch! Stored:', embeddingVector.length, 'Query:', queryEmbedding.length);
          return { ...item, similarity: 0 };
        }
        
        // Check for NaN values in stored embedding
        const storedNanCount = embeddingVector.filter(v => isNaN(v)).length;
        if (storedNanCount > 0) {
          console.error(`❌ Found ${storedNanCount} NaN values in stored embedding ${item.id}!`);
          return { ...item, similarity: 0 };
        }
        
        const similarity = this.calculateCosineSimilarity(queryEmbedding, embeddingVector);
        console.log(`✅ Similarity calculated for ${item.id}: ${similarity}`);
        
        return {
          ...item,
          similarity: similarity
        };
      }).filter(item => {
        const isValid = !isNaN(item.similarity) && isFinite(item.similarity);
        if (!isValid) {
          console.log(`⚠️ Filtering out invalid similarity for ${item.id}: ${item.similarity}`);
        }
        return isValid;
      });

      console.log('\n=== FINAL SIMILARITY RESULTS ===');
      results.forEach(r => {
        console.log(`${r.id}: ${r.similarity.toFixed(6)} (${(r.similarity * 100).toFixed(2)}%)`);
      });

      // Sort by similarity and return top results
      const sortedResults = results.sort((a, b) => b.similarity - a.similarity);
      console.log('\n=== SORTED RESULTS (highest first) ===');
      sortedResults.forEach(r => {
        console.log(`${r.id}: ${r.similarity.toFixed(6)} (${(r.similarity * 100).toFixed(2)}%)`);
      });

      const threshold = 0.1;
      const filteredResults = sortedResults
        .filter(item => {
          const passes = item.similarity > threshold;
          console.log(`${item.id} passes threshold (>${threshold}): ${passes} (similarity: ${item.similarity.toFixed(6)})`);
          return passes;
        })
        .slice(0, limit);

      console.log(`\n✅ Returning ${filteredResults.length} results above threshold ${threshold}:`);
      filteredResults.forEach(r => {
        console.log(`  - ${r.id}: ${r.similarity.toFixed(6)} (${(r.similarity * 100).toFixed(2)}%)`);
      });

      console.log('=== SEMANTIC SEARCH DEBUG END ===\n');
      return filteredResults;
    } catch (error) {
      console.error('❌ Failed to search similar changelogs:', error);
      console.error('Error stack:', error.stack);
      return [];
    }
  }

  private calculateCosineSimilarity(a: number[], b: number[]): number {
    if (!a || !b || a.length !== b.length) {
      console.warn('Invalid vectors for cosine similarity calculation');
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      if (isNaN(a[i]) || isNaN(b[i])) {
        console.warn(`NaN values detected at index ${i}: a[${i}]=${a[i]}, b[${i}]=${b[i]}`);
        return 0;
      }
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) {
      console.warn('Zero denominator in cosine similarity calculation');
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
