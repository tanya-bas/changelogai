
import { useState } from 'react';
import { pipeline } from "@huggingface/transformers";
import { toast } from "sonner";

export const useChangelogGenerator = () => {
  const [generatedChangelog, setGeneratedChangelog] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);

  const generateChangelog = async (version: string, commits: string) => {
    if (!commits.trim() || !version.trim()) {
      toast.error("Please enter both version and commits");
      return;
    }

    setIsGenerating(true);
    setIsModelLoading(true);
    
    try {
      console.log('Loading Hugging Face model...');
      toast.info("Loading AI model... This may take a moment on first use");
      
      // Create a text generation pipeline using a smaller, faster model
      const generator = await pipeline(
        "text-generation",
        "microsoft/DialoGPT-medium",
        { device: "webgpu" }
      );

      setIsModelLoading(false);
      console.log('Model loaded, generating changelog...');

      const prompt = `Transform these commit messages into a well-formatted changelog for version ${version}:

Commits:
${commits}

Format as markdown with sections for:
- 🚀 New Features
- ⚡ Improvements  
- 🐛 Bug Fixes

Make it user-friendly and clear:`;

      const result = await generator(prompt, {
        max_new_tokens: 500,
        temperature: 0.3,
        do_sample: true,
        repetition_penalty: 1.1,
      });

      console.log('Generated result:', result);
      
      // Handle the result properly - it should be an array of objects
      let changelog = '';
      if (Array.isArray(result) && result.length > 0) {
        // Check if the result has the expected structure
        const firstResult = result[0];
        if (typeof firstResult === 'object' && firstResult !== null) {
          // Try different possible property names
          changelog = (firstResult as any).generated_text || 
                     (firstResult as any).text || 
                     (firstResult as any).output || 
                     String(firstResult);
        }
      } else if (typeof result === 'string') {
        changelog = result;
      }

      if (changelog && changelog.trim()) {
        // Clean up the generated text and format it properly
        const cleanedChangelog = changelog.replace(prompt, '').trim();
        const finalChangelog = `## Version ${version}\n\n${cleanedChangelog}`;
        setGeneratedChangelog(finalChangelog);
        toast.success("AI-enhanced changelog generated successfully!");
      } else {
        throw new Error('No changelog generated');
      }
      
    } catch (error: any) {
      console.error('Error generating changelog:', error);
      
      // Fallback to a simpler local processing if the model fails
      console.log('Falling back to rule-based generation...');
      const fallbackChangelog = generateFallbackChangelog(version, commits);
      setGeneratedChangelog(fallbackChangelog);
      toast.success("Changelog generated using fallback method");
      
    } finally {
      setIsGenerating(false);
      setIsModelLoading(false);
    }
  };

  const generateFallbackChangelog = (version: string, commits: string): string => {
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
    isModelLoading,
    generateChangelog,
    setGeneratedChangelog
  };
};
