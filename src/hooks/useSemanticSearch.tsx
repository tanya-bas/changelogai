
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ChangelogEntry {
  id: number;
  version: string;
  content: string;
  created_at: string;
  commits: string;
  user_id: string;
  product?: string;
}

const useSemanticSearch = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<string>("");

  const performSemanticSearch = async (query: string, changelogs: ChangelogEntry[]) => {
    if (!query.trim()) {
      toast.error("Please enter a search query");
      return;
    }

    setIsSearching(true);
    setSearchResult("");

    try {
      console.log('Performing semantic search for:', query);
      
      // For now, we'll use a simple text-based similarity until embeddings are set up
      // This is a placeholder implementation that will be enhanced with proper embeddings
      const relevantChangelogs = changelogs
        .map(changelog => ({
          ...changelog,
          similarity: calculateTextSimilarity(query.toLowerCase(), 
            `${changelog.version} ${changelog.content} ${changelog.product || ''}`.toLowerCase())
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 3);

      console.log('Top 3 relevant changelogs:', relevantChangelogs);

      // Call the LLM to generate a natural language response
      const { data, error } = await supabase.functions.invoke('semantic-search', {
        body: {
          query: query.trim(),
          changelogs: relevantChangelogs.map(c => ({
            version: c.version,
            content: c.content,
            product: c.product,
            created_at: c.created_at
          }))
        }
      });

      if (error) {
        console.error('Semantic search error:', error);
        throw new Error(error.message || 'Failed to perform semantic search');
      }

      if (!data || !data.response) {
        throw new Error('No response returned from semantic search');
      }

      console.log('Semantic search response generated successfully');
      setSearchResult(data.response);
      
    } catch (error: any) {
      console.error('Error performing semantic search:', error);
      toast.error("Failed to perform semantic search: " + error.message);
    } finally {
      setIsSearching(false);
    }
  };

  // Simple text similarity calculation (placeholder for proper embeddings)
  const calculateTextSimilarity = (query: string, text: string): number => {
    const queryWords = query.split(' ').filter(word => word.length > 2);
    const textWords = text.split(' ');
    
    let matches = 0;
    queryWords.forEach(queryWord => {
      if (textWords.some(textWord => textWord.includes(queryWord) || queryWord.includes(textWord))) {
        matches++;
      }
    });
    
    return matches / queryWords.length;
  };

  return {
    isSearching,
    searchResult,
    performSemanticSearch,
    setSearchResult
  };
};

export default useSemanticSearch;
