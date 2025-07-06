
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
    setIsSearching(true);
    try {
      const results = await changelogEmbeddingService.searchSimilarChangelogs(query, limit);
      return results;
    } catch (error: any) {
      console.error('Failed to search changelogs:', error);
      toast.error('Failed to search changelogs: ' + error.message);
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
