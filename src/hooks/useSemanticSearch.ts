
import { useState } from 'react';
import { changelogEmbeddingService } from '@/services/changelogEmbedding';
import { VectorDocument } from '@/services/vectorStorage';
import { toast } from 'sonner';

export const useSemanticSearch = () => {
  const [isEmbedding, setIsEmbedding] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const embedAllChangelogs = async () => {
    setIsEmbedding(true);
    try {
      await changelogEmbeddingService.embedAllChangelogs();
      toast.success('All changelogs have been embedded for semantic search!');
    } catch (error: any) {
      console.error('Failed to embed changelogs:', error);
      toast.error('Failed to embed changelogs: ' + error.message);
    } finally {
      setIsEmbedding(false);
    }
  };

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

  const embedSingleChangelog = async (changelog: any) => {
    try {
      await changelogEmbeddingService.embedChangelog(changelog);
    } catch (error: any) {
      console.error('Failed to embed changelog:', error);
      toast.error('Failed to embed changelog: ' + error.message);
    }
  };

  const deleteChangelogEmbedding = async (changelogId: number) => {
    try {
      await changelogEmbeddingService.deleteChangelogEmbedding(changelogId);
    } catch (error: any) {
      console.error('Failed to delete changelog embedding:', error);
      toast.error('Failed to delete changelog embedding: ' + error.message);
    }
  };

  return {
    isEmbedding,
    isSearching,
    embedAllChangelogs,
    searchSimilarChangelogs,
    embedSingleChangelog,
    deleteChangelogEmbedding
  };
};
