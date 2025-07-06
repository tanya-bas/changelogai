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
    console.log('🔧 AdvancedChangelogGenerator constructor called');
    // Initialize OpenAI - user will need to set VITE_OPENAI_API_KEY
    this.openai = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true // Required for client-side usage
    });
    console.log('🔧 OpenAI client initialized');
  }

  private async getChangelogContext(limit = 3): Promise<ChangelogContext> {
    console.log('📋 Getting changelog context...');
    try {
      const { data: previousChangelogs, error } = await supabase
        .from('changelogs')
        .select('version, content, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Error fetching changelog context:', error);
        return { previousVersions: [], recentTrends: { focusAreas: [], commonPatterns: [] } };
      }

      const previousVersions = (previousChangelogs || []).map(log => ({
        version: log.version,
        content: log.content,
        date: log.created_at
      }));

      console.log('📋 Previous versions found:', previousVersions.length);
      const recentTrends = this.analyzeTrends(previousVersions);
      return { previousVersions, recentTrends };
    } catch (error) {
      console.error('❌ Error getting changelog context:', error);
      return { previousVersions: [], recentTrends: { focusAreas: [], commonPatterns: [] } };
    }
  }

  private analyzeTrends(previousVersions: Array<{ content: string }>): { focusAreas: string[]; commonPatterns: string[] } {
    console.log('🔍 Analyzing trends for', previousVersions.length, 'versions');
    const focusAreas: string[] = [];
    const commonPatterns: string[] = [];

    if (previousVersions.length === 0) {
      console.log('🔍 No previous versions to analyze');
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

    console.log('🔍 Trends analyzed - Focus areas:', focusAreas, 'Patterns:', commonPatterns);
    return { focusAreas: focusAreas.slice(0, 3), commonPatterns };
  }

  private async generateWithLLM(commits: string, version: string, context: ChangelogContext): Promise<string> {
    console.log('🤖 Starting LLM generation with hardcoded response');
    console.log('🤖 Version:', version);
    console.log('🤖 Commits length:', commits.length);
    console.log('🤖 Context:', context);
    
    // Return hardcoded message for debugging
    const hardcodedChangelog = `## Version ${version}

### 🚀 New Features
- Enhanced user authentication system with improved security
- Added real-time notifications for better user engagement
- Introduced dark mode toggle for improved accessibility

### ⚡ Improvements  
- Optimized database queries for 40% faster load times
- Enhanced mobile responsiveness across all pages
- Streamlined user onboarding process

### 🐛 Bug Fixes
- Fixed navigation issues on smaller screens
- Resolved data synchronization problems
- Corrected email validation errors in forms

### 🔧 Technical Updates
- Updated dependencies to latest stable versions
- Improved error handling and logging
- Enhanced API response caching`;

    console.log('🤖 Generated hardcoded changelog length:', hardcodedChangelog.length);
    console.log('🤖 Generated hardcoded changelog preview:', hardcodedChangelog.substring(0, 100) + '...');
    
    return hardcodedChangelog;
  }

  // Keep the simple generation as fallback
  private generateSimpleChangelog(commits: string, version: string): string {
    console.log('📝 Generating simple changelog');
    console.log('📝 Version:', version);
    console.log('📝 Commits:', commits);
    
    const commitLines = commits.split('\n').filter(line => line.trim());
    console.log('📝 Commit lines found:', commitLines.length);
    
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

    console.log('📝 Changes categorized:', changes);

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

    console.log('📝 Simple changelog generated length:', changelog.length);
    console.log('📝 Simple changelog preview:', changelog.substring(0, 100) + '...');
    
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
    console.log('🚀 generateAdvancedChangelog called');
    console.log('🚀 Version:', version);
    console.log('🚀 Commit messages length:', commitMessages.length);
    console.log('🚀 Commit messages preview:', commitMessages.substring(0, 100));
    
    if (!commitMessages || commitMessages.trim().length === 0) {
      console.log('⚠️ No commit messages provided, using simple generation');
      const result = this.generateSimpleChangelog('No commits provided', version);
      console.log('⚠️ Simple generation result length:', result.length);
      return result;
    }
    
    try {
      console.log('🎯 Starting advanced generation process...');
      const context = await this.getChangelogContext();
      console.log('🎯 Context retrieved:', context);
      
      // Try LLM-based generation first
      console.log('🎯 Calling generateWithLLM...');
      const result = await this.generateWithLLM(commitMessages, version, context);
      console.log('🎯 LLM generation completed');
      console.log('🎯 Result length:', result.length);
      console.log('🎯 Result preview:', result.substring(0, 200) + '...');
      
      if (!result || result.trim().length === 0) {
        console.error('❌ LLM generated empty result!');
        throw new Error('LLM generated empty result');
      }
      
      return result;
    } catch (error: any) {
      console.error('❌ Advanced generation failed:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      
      // Fallback to simple generation if LLM fails
      console.log('🔄 Falling back to simple generation...');
      const fallbackResult = this.generateSimpleChangelog(commitMessages, version);
      console.log('🔄 Fallback result length:', fallbackResult.length);
      console.log('🔄 Fallback result preview:', fallbackResult.substring(0, 200) + '...');
      
      if (!fallbackResult || fallbackResult.trim().length === 0) {
        console.error('❌ Even fallback generated empty result!');
        return `## Version ${version}\n\n### 🔧 Updates\n- Miscellaneous improvements and fixes\n`;
      }
      
      return fallbackResult;
    }
  }
}

export const changelogGenerator = new AdvancedChangelogGenerator();
