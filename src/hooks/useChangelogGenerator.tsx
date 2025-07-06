
import { useState } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const useChangelogGenerator = () => {
  const [generatedChangelog, setGeneratedChangelog] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const generateChangelog = async (version: string, commits: string) => {
    if (!commits.trim() || !version.trim()) {
      toast.error("Please enter both version and commits");
      return;
    }

    setIsGenerating(true);
    
    try {
      console.log('Calling OpenAI edge function...');
      
      // Call the Supabase edge function
      const { data, error } = await supabase.functions.invoke('generate-changelog', {
        body: {
          version: version.trim(),
          commits: commits.trim()
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
