
import { useState } from 'react';
import { changelogEmbeddingService } from '@/services/changelogEmbedding';
import { toast } from 'sonner';

interface ChangelogSearchResult {
  id: string;
  content: string;
  embedding: number[];
  version: string;
  product?: string;
  created_at: string;
  changelog_id: number;
  similarity: number;
}

export const useSemanticSearch = () => {
  const [isSearching, setIsSearching] = useState(false);

  const searchSimilarChangelogs = async (query: string, limit?: number): Promise<ChangelogSearchResult[]> => {
    console.log('🎯 useSemanticSearch.searchSimilarChangelogs called');
    console.log('Query received in hook:', query.substring(0, 100) + '...');
    console.log('Query length in hook:', query.length);
    console.log('Limit in hook:', limit);

    if (!query.trim()) {
      console.log('⚠️ Empty query provided for semantic search');
      return [];
    }

    setIsSearching(true);
    try {
      console.log(`🔄 Searching for ${limit || 3} similar changelogs...`);
      console.log('🔄 Calling changelogEmbeddingService.searchSimilarChangelogs...');
      
      const results = await changelogEmbeddingService.searchSimilarChangelogs(query, limit);
      
      console.log(`✅ Hook received ${results.length} results from service`);
      results.forEach((result, index) => {
        console.log(`  Result ${index + 1}: ${result.id} (similarity: ${result.similarity})`);
      });
      
      return results;
    } catch (error: any) {
      console.error('❌ Failed to search changelogs in hook:', error);
      console.error('Error stack:', error.stack);
      // Don't show toast error for background searches during changelog generation
      // toast.error('Failed to search changelogs: ' + error.message);
      return [];
    } finally {
      setIsSearching(false);
    }
  };

  return {
    isSearching,
    searchSimilarChangelogs
  };
};
