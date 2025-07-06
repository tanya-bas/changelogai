
import { useState } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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

export const useChangelogGenerator = () => {
  const [generatedChangelog, setGeneratedChangelog] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const generateChangelog = async (
    version: string, 
    commits: string, 
    selectedPreviousChangelogs: ChangelogSearchResult[] = []
  ) => {
    if (!commits.trim() || !version.trim()) {
      toast.error("Please enter both version and commits");
      return;
    }

    setIsGenerating(true);
    
    try {
      console.log('Generating changelog with selected context:', selectedPreviousChangelogs.length);
      
      // Call the Supabase edge function with selected context
      const { data, error } = await supabase.functions.invoke('generate-changelog', {
        body: {
          version: version.trim(),
          commits: commits.trim(),
          previousChangelogs: selectedPreviousChangelogs
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to generate changelog');
      }

      if (!data || !data.changelog) {
        throw new Error('No changelog returned from AI service');
      }

      console.log('OpenAI changelog generated successfully');
      setGeneratedChangelog(data.changelog);
      toast.success("AI-powered changelog generated successfully!");
      
    } catch (error: any) {
      console.error('Error generating changelog:', error);
      toast.error("Failed to generate changelog: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generatedChangelog,
    isGenerating,
    generateChangelog,
    setGeneratedChangelog
  };
};
