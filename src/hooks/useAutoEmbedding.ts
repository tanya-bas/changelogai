
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { changelogEmbeddingService } from '@/services/changelogEmbedding';
import { toast } from 'sonner';

export const useAutoEmbedding = () => {
  useEffect(() => {
    console.log('Setting up automatic embedding listeners...');

    // Subscribe to changelog changes
    const channel = supabase
      .channel('changelog-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'changelogs'
        },
        async (payload) => {
          console.log('New changelog detected, auto-embedding:', payload.new);
          try {
            await changelogEmbeddingService.embedChangelog(payload.new as any);
            console.log(`Auto-embedded new changelog ${payload.new.id}`);
          } catch (error) {
            console.error('Failed to auto-embed new changelog:', error);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'changelogs'
        },
        async (payload) => {
          console.log('Changelog updated, re-embedding:', payload.new);
          try {
            // Delete old embedding first
            await changelogEmbeddingService.deleteChangelogEmbedding(payload.new.id);
            // Create new embedding
            await changelogEmbeddingService.embedChangelog(payload.new as any);
            console.log(`Re-embedded updated changelog ${payload.new.id}`);
          } catch (error) {
            console.error('Failed to re-embed updated changelog:', error);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'changelogs'
        },
        async (payload) => {
          console.log('Changelog deleted, removing embedding:', payload.old);
          try {
            await changelogEmbeddingService.deleteChangelogEmbedding(payload.old.id);
            console.log(`Removed embedding for deleted changelog ${payload.old.id}`);
          } catch (error) {
            console.error('Failed to remove embedding for deleted changelog:', error);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up automatic embedding listeners...');
      supabase.removeChannel(channel);
    };
  }, []);
};
