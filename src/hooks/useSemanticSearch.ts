
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
    if (!query.trim()) {
      console.log('Empty query provided for semantic search');
      return [];
    }

    setIsSearching(true);
    try {
      console.log(`Searching for ${limit || 3} similar changelogs...`);
      const results = await changelogEmbeddingService.searchSimilarChangelogs(query, limit);
      console.log(`Found ${results.length} similar changelogs`);
      return results;
    } catch (error: any) {
      console.error('Failed to search changelogs:', error);
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
