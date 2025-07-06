
import { useState } from 'react';
import { changelogEmbeddingService } from '@/services/changelogEmbedding';
import { VectorDocument } from '@/services/vectorStorage';
import { toast } from 'sonner';

export const useSemanticSearch = () => {
  const [isSearching, setIsSearching] = useState(false);

  const searchSimilarChangelogs = async (query: string, limit?: number): Promise<Array<VectorDocument & { similarity: number }>> => {
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
