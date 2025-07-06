
import { embeddingService } from './embeddingService';
import { vectorStorage, VectorDocument } from './vectorStorage';
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
      console.log(`Embedding changelog ${changelog.id} with Supabase pgvector...`);
      
      // Create searchable text combining version, product, and content
      const searchableText = [
        `Version ${changelog.version}`,
        changelog.product ? `Product: ${changelog.product}` : '',
        changelog.content
      ].filter(Boolean).join('\n\n');

      const embedding = await embeddingService.generateEmbedding(searchableText);

      const document: VectorDocument = {
        id: `changelog_${changelog.id}`,
        content: searchableText,
        embedding,
        metadata: {
          version: changelog.version,
          product: changelog.product,
          created_at: changelog.created_at,
          changelog_id: changelog.id
        }
      };

      await vectorStorage.storeDocument(document);
      console.log(`Successfully embedded changelog ${changelog.id} to Supabase`);
    } catch (error) {
      console.error(`Failed to embed changelog ${changelog.id}:`, error);
      throw error;
    }
  }

  async embedAllChangelogs(): Promise<void> {
    try {
      console.log('Fetching all changelogs for embedding with pgvector...');
      const { data: changelogs, error } = await supabase
        .from('changelogs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!changelogs || changelogs.length === 0) {
        console.log('No changelogs found to embed');
        return;
      }

      console.log(`Embedding ${changelogs.length} changelogs to Supabase...`);
      
      // Process in batches to avoid overwhelming the system
      const batchSize = 3; // Reduced batch size for more reliable processing
      for (let i = 0; i < changelogs.length; i += batchSize) {
        const batch = changelogs.slice(i, i + batchSize);
        await Promise.all(batch.map(changelog => this.embedChangelog(changelog)));
        console.log(`Embedded batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(changelogs.length / batchSize)}`);
        
        // Add a small delay between batches
        if (i + batchSize < changelogs.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log('All changelogs embedded successfully to Supabase');
    } catch (error) {
      console.error('Failed to embed changelogs:', error);
      throw error;
    }
  }

  async searchSimilarChangelogs(query: string, limit: number = 3): Promise<Array<VectorDocument & { similarity: number }>> {
    try {
      console.log('Searching similar changelogs with pgvector...');
      const queryEmbedding = await embeddingService.generateEmbedding(query);
      
      // Try pgvector search first, fallback to client-side search
      try {
        return await vectorStorage.searchWithPgVector(queryEmbedding, limit);
      } catch (pgvectorError) {
        console.warn('pgvector search failed, falling back to client-side search:', pgvectorError);
        return await vectorStorage.search(queryEmbedding, limit);
      }
    } catch (error) {
      console.error('Failed to search similar changelogs:', error);
      throw error;
    }
  }

  async deleteChangelogEmbedding(changelogId: number): Promise<void> {
    try {
      await vectorStorage.deleteByChangelogId(changelogId);
      console.log(`Deleted embedding for changelog ${changelogId} from Supabase`);
    } catch (error) {
      console.error(`Failed to delete embedding for changelog ${changelogId}:`, error);
      throw error;
    }
  }
}

export const changelogEmbeddingService = new ChangelogEmbeddingService();
