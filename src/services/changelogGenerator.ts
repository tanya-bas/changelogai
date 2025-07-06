import { supabase } from '@/integrations/supabase/client';
import OpenAI from 'openai';

export interface CommitAnalysis {
  type: 'feat' | 'fix' | 'perf' | 'refactor' | 'docs' | 'style' | 'test' | 'chore';
  scope?: string;
  description: string;
  breakingChange: boolean;
  impact: 'major' | 'minor' | 'patch';
}

export interface ChangelogContext {
  previousVersions: Array<{
    version: string;
    content: string;
    date: string;
  }>;
  recentTrends: {
    focusAreas: string[];
    commonPatterns: string[];
  };
}

export class AdvancedChangelogGenerator {
  private openai: OpenAI;

  constructor() {
    // Initialize OpenAI - user will need to set VITE_OPENAI_API_KEY
    this.openai = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true // Required for client-side usage
    });
  }

  private async getChangelogContext(limit = 3): Promise<ChangelogContext> {
    try {
      const { data: previousChangelogs, error } = await supabase
        .from('changelogs')
        .select('version, content, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching changelog context:', error);
        return { previousVersions: [], recentTrends: { focusAreas: [], commonPatterns: [] } };
      }

      const previousVersions = (previousChangelogs || []).map(log => ({
        version: log.version,
        content: log.content,
        date: log.created_at
      }));

      const recentTrends = this.analyzeTrends(previousVersions);
      return { previousVersions, recentTrends };
    } catch (error) {
      console.error('Error getting changelog context:', error);
      return { previousVersions: [], recentTrends: { focusAreas: [], commonPatterns: [] } };
    }
  }

  private analyzeTrends(previousVersions: Array<{ content: string }>): { focusAreas: string[]; commonPatterns: string[] } {
    const focusAreas: string[] = [];
    const commonPatterns: string[] = [];

    if (previousVersions.length === 0) {
      return { focusAreas, commonPatterns };
    }

    const allContent = previousVersions.map(v => v.content.toLowerCase()).join(' ');
    
    const techFocusAreas = [
      'security', 'performance', 'user experience', 'api', 'dashboard',
      'mobile', 'integration', 'authentication', 'data', 'analytics'
    ];

    techFocusAreas.forEach(area => {
      if (allContent.includes(area)) {
        focusAreas.push(area);
      }
    });

    if (allContent.includes('fix') || allContent.includes('bug')) {
      commonPatterns.push('bug-fixes');
    }
    if (allContent.includes('improve') || allContent.includes('enhance')) {
      commonPatterns.push('improvements');
    }
    if (allContent.includes('new') || allContent.includes('add')) {
      commonPatterns.push('feature-additions');
    }

    return { focusAreas: focusAreas.slice(0, 3), commonPatterns };
  }

  private async generateWithLLM(commits: string, version: string, context: ChangelogContext): Promise<string> {
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in your environment variables.');
    }

    const contextInfo = context.previousVersions.length > 0 
      ? `\n\nPrevious release context:\n${context.previousVersions.slice(0, 2).map(v => `${v.version}: ${v.content.substring(0, 200)}...`).join('\n')}`
      : '';

    const prompt = `You are a technical writer creating a changelog for version ${version}. Convert these raw commit messages into a professional, user-friendly changelog.

Raw commits:
${commits}

Requirements:
- Be SPECIFIC about what was actually changed (don't be generic)
- Don't add technical details not mentioned in the commits
- If bugs were fixed, explicitly mention that
- Use clear, concise language that users can understand
- Categorize changes appropriately (🚀 New Features, 🐛 Bug Fixes, ⚡ Performance, etc.)
- Keep descriptions focused on user benefits
- Don't fabricate implementation details
- If it mentions specific integrations (like "Google auth"), be specific about that

Format as markdown with:
- ## Version ${version} header
- Category sections with appropriate emojis
- Bullet points for each change
- Keep it concise but informative${contextInfo}`;

    console.log('Sending prompt to OpenAI:', prompt);

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a professional technical writer specializing in creating clear, accurate changelogs. You focus on being specific and accurate, never adding details that weren't mentioned in the source material."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.3 // Lower temperature for more consistent, factual output
      });

      const generated = completion.choices[0]?.message?.content;
      if (!generated) {
        throw new Error('No content generated from OpenAI');
      }

      console.log('Generated changelog:', generated);
      return generated;
    } catch (error: any) {
      console.error('OpenAI API error:', error);
      if (error.code === 'insufficient_quota') {
        throw new Error('OpenAI API quota exceeded. Please check your billing settings.');
      } else if (error.code === 'invalid_api_key') {
        throw new Error('Invalid OpenAI API key. Please check your VITE_OPENAI_API_KEY environment variable.');
      } else {
        throw new Error(`OpenAI API error: ${error.message}`);
      }
    }
  }

  // Keep the simple generation as fallback
  private generateSimpleChangelog(commits: string, version: string): string {
    const commitLines = commits.split('\n').filter(line => line.trim());
    const changes = {
      features: [] as string[],
      improvements: [] as string[],
      fixes: [] as string[]
    };

    commitLines.forEach(commit => {
      const lower = commit.toLowerCase();
      if (lower.includes('feat') || lower.includes('add') || lower.includes('new')) {
        changes.features.push(this.extractChangeDescription(commit));
      } else if (lower.includes('fix') || lower.includes('bug') || lower.includes('resolve')) {
        changes.fixes.push(this.extractChangeDescription(commit));
      } else {
        changes.improvements.push(this.extractChangeDescription(commit));
      }
    });

    let changelog = `## Version ${version}\n\n`;
    
    if (changes.features.length > 0) {
      changelog += "### 🚀 New Features\n";
      changes.features.forEach(feature => {
        changelog += `- ${feature}\n`;
      });
      changelog += "\n";
    }

    if (changes.improvements.length > 0) {
      changelog += "### ⚡ Improvements\n";
      changes.improvements.forEach(improvement => {
        changelog += `- ${improvement}\n`;
      });
      changelog += "\n";
    }

    if (changes.fixes.length > 0) {
      changelog += "### 🐛 Bug Fixes\n";
      changes.fixes.forEach(fix => {
        changelog += `- ${fix}\n`;
      });
      changelog += "\n";
    }

    return changelog;
  }

  private extractChangeDescription(commit: string): string {
    let description = commit
      .replace(/^(feat|fix|chore|docs|style|refactor|test)(\(.+\))?:\s*/i, '')
      .replace(/^Merge .+/, '')
      .trim();
    
    if (description) {
      description = description.charAt(0).toUpperCase() + description.slice(1);
    }
    
    return description || 'Miscellaneous updates';
  }

  public async generateAdvancedChangelog(version: string, commitMessages: string): Promise<string> {
    console.log('Generating advanced changelog for version:', version);
    
    try {
      const context = await this.getChangelogContext();
      
      // Try LLM-based generation first
      return await this.generateWithLLM(commitMessages, version, context);
    } catch (error: any) {
      console.error('Advanced generation failed, falling back to simple generation:', error);
      
      // Fallback to simple generation if LLM fails
      return this.generateSimpleChangelog(commitMessages, version);
    }
  }
}

export const changelogGenerator = new AdvancedChangelogGenerator();
