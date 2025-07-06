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
      
      // Call the Supabase edge function with the correct name
      const { data, error } = await supabase.functions.invoke('dynamic-responder', {
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
      
      // Fallback to rule-based generation
      console.log('Falling back to rule-based generation...');
      try {
        const changelog = generateRuleBasedChangelog(version, commits);
        setGeneratedChangelog(changelog);
        toast.success("Changelog generated using fallback method");
      } catch (fallbackError: any) {
        toast.error("Failed to generate changelog: " + error.message);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const generateRuleBasedChangelog = (version: string, commits: string): string => {
    const commitLines = commits.split('\n').filter(line => line.trim());
    
    const features: string[] = [];
    const improvements: string[] = [];
    const fixes: string[] = [];
    const other: string[] = [];

    commitLines.forEach(commit => {
      const cleanCommit = commit.trim();
      if (!cleanCommit) return;

      const lowerCommit = cleanCommit.toLowerCase();
      
      if (lowerCommit.includes('feat') || lowerCommit.includes('add') || lowerCommit.includes('new')) {
        features.push(`- ${cleanCommit.replace(/^(feat|add|new)[:\s]*/, '').replace(/^[a-z]/, c => c.toUpperCase())}`);
      } else if (lowerCommit.includes('fix') || lowerCommit.includes('bug') || lowerCommit.includes('resolve')) {
        fixes.push(`- ${cleanCommit.replace(/^(fix|bug|resolve)[:\s]*/, '').replace(/^[a-z]/, c => c.toUpperCase())}`);
      } else if (lowerCommit.includes('improve') || lowerCommit.includes('enhance') || lowerCommit.includes('update') || lowerCommit.includes('perf')) {
        improvements.push(`- ${cleanCommit.replace(/^(improve|enhance|update|perf)[:\s]*/, '').replace(/^[a-z]/, c => c.toUpperCase())}`);
      } else {
        other.push(`- ${cleanCommit.replace(/^[a-z]/, c => c.toUpperCase())}`);
      }
    });

    let changelog = `## Version ${version}\n\n`;
    
    if (features.length > 0) {
      changelog += `### 🚀 New Features\n${features.join('\n')}\n\n`;
    }
    
    if (improvements.length > 0) {
      changelog += `### ⚡ Improvements\n${improvements.join('\n')}\n\n`;
    }
    
    if (fixes.length > 0) {
      changelog += `### 🐛 Bug Fixes\n${fixes.join('\n')}\n\n`;
    }
    
    if (other.length > 0) {
      changelog += `### 🔧 Other Changes\n${other.join('\n')}\n\n`;
    }

    return changelog.trim();
  };

  return {
    generatedChangelog,
    isGenerating,
    generateChangelog,
    setGeneratedChangelog
  };
};
