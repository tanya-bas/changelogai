
import { useState } from 'react';
import { changelogEmbeddingService } from '@/services/changelogEmbedding';
import { toast } from 'sonner';

export const useEmbeddingManager = () => {
  const [isReEmbedding, setIsReEmbedding] = useState(false);
  const [embeddingCount, setEmbeddingCount] = useState<number | null>(null);

  const reEmbedAllChangelogs = async () => {
    setIsReEmbedding(true);
    try {
      toast.info('Starting to re-embed all changelogs...');
      await changelogEmbeddingService.reEmbedAllChangelogs();
      toast.success('All changelogs have been successfully re-embedded!');
      await refreshEmbeddingCount();
    } catch (error: any) {
      console.error('Failed to re-embed changelogs:', error);
      toast.error('Failed to re-embed changelogs: ' + error.message);
    } finally {
      setIsReEmbedding(false);
    }
  };

  const refreshEmbeddingCount = async () => {
    try {
      const count = await changelogEmbeddingService.getEmbeddingCount();
      setEmbeddingCount(count);
    } catch (error) {
      console.error('Failed to get embedding count:', error);
    }
  };

  return {
    isReEmbedding,
    embeddingCount,
    reEmbedAllChangelogs,
    refreshEmbeddingCount
  };
};
