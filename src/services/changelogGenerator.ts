
import { supabase } from '@/integrations/supabase/client';

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
  private async getChangelogContext(limit = 5): Promise<ChangelogContext> {
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

      // Analyze trends from previous changelogs
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

    // Extract common themes from previous changelogs
    const allContent = previousVersions.map(v => v.content.toLowerCase()).join(' ');
    
    // Common focus areas in tech companies
    const techFocusAreas = [
      'security', 'performance', 'user experience', 'api', 'dashboard',
      'mobile', 'integration', 'authentication', 'data', 'analytics'
    ];

    techFocusAreas.forEach(area => {
      if (allContent.includes(area)) {
        focusAreas.push(area);
      }
    });

    // Common patterns
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

  private analyzeCommits(commits: string[]): CommitAnalysis[] {
    return commits.map(commit => {
      const trimmed = commit.trim();
      if (!trimmed) return null;

      // Parse conventional commit format
      const conventionalRegex = /^(feat|fix|perf|refactor|docs|style|test|chore)(\(([^)]+)\))?: (.+)$/i;
      const match = trimmed.match(conventionalRegex);

      let type: CommitAnalysis['type'] = 'chore';
      let scope: string | undefined;
      let description = trimmed;
      let breakingChange = false;

      if (match) {
        type = match[1].toLowerCase() as CommitAnalysis['type'];
        scope = match[3];
        description = match[4];
        breakingChange = trimmed.includes('BREAKING CHANGE') || trimmed.includes('!:');
      } else {
        // Fallback analysis for non-conventional commits
        const lower = trimmed.toLowerCase();
        if (lower.includes('feat') || lower.includes('add') || lower.includes('new')) {
          type = 'feat';
        } else if (lower.includes('fix') || lower.includes('bug') || lower.includes('resolve')) {
          type = 'fix';
        } else if (lower.includes('perf') || lower.includes('optimize')) {
          type = 'perf';
        } else if (lower.includes('refactor') || lower.includes('restructure')) {
          type = 'refactor';
        }
        
        // Clean up description
        description = description
          .replace(/^(feat|fix|add|new|bug|resolve|perf|optimize|refactor)(\(.+\))?:\s*/i, '')
          .replace(/^Merge .+/, 'Code integration')
          .trim();
      }

      // Determine impact level
      let impact: CommitAnalysis['impact'] = 'patch';
      if (type === 'feat' || breakingChange) {
        impact = breakingChange ? 'major' : 'minor';
      } else if (type === 'perf') {
        impact = 'minor';
      }

      return {
        type,
        scope,
        description: description.charAt(0).toUpperCase() + description.slice(1),
        breakingChange,
        impact
      };
    }).filter(Boolean) as CommitAnalysis[];
  }

  private generateContextualIntro(version: string, context: ChangelogContext, commits: CommitAnalysis[]): string {
    const hasBreakingChanges = commits.some(c => c.breakingChange);
    const featureCount = commits.filter(c => c.type === 'feat').length;
    const fixCount = commits.filter(c => c.type === 'fix').length;
    const perfImprovements = commits.filter(c => c.type === 'perf').length;

    let intro = `## Version ${version}\n\n`;

    // Add contextual introduction based on previous releases
    if (hasBreakingChanges) {
      intro += `⚠️ **Breaking Changes**: This release includes breaking changes. Please review the migration guide below.\n\n`;
    }

    // Generate contextual summary
    const summaryParts = [];
    if (featureCount > 0) {
      summaryParts.push(`${featureCount} new feature${featureCount > 1 ? 's' : ''}`);
    }
    if (fixCount > 0) {
      summaryParts.push(`${fixCount} bug fix${fixCount > 1 ? 'es' : ''}`);
    }
    if (perfImprovements > 0) {
      summaryParts.push(`${perfImprovements} performance improvement${perfImprovements > 1 ? 's' : ''}`);
    }

    if (summaryParts.length > 0) {
      const summary = summaryParts.join(', ').replace(/, ([^,]*)$/, ', and $1');
      intro += `This release brings ${summary}, continuing our focus on ${context.recentTrends.focusAreas.join(' and ') || 'product excellence'}.\n\n`;
    }

    return intro;
  }

  private categorizeAndFormatChanges(commits: CommitAnalysis[]): string {
    let output = '';

    // Group by type with professional formatting
    const categories = [
      { type: 'feat', title: '🚀 New Features', emoji: '✨' },
      { type: 'perf', title: '⚡ Performance Improvements', emoji: '🔥' },
      { type: 'fix', title: '🐛 Bug Fixes', emoji: '🔧' },
      { type: 'refactor', title: '🔄 Code Improvements', emoji: '♻️' },
      { type: 'docs', title: '📚 Documentation', emoji: '📖' },
      { type: 'style', title: '💅 UI/UX Improvements', emoji: '🎨' }
    ];

    // Breaking changes first
    const breakingChanges = commits.filter(c => c.breakingChange);
    if (breakingChanges.length > 0) {
      output += `### ⚠️ Breaking Changes\n\n`;
      breakingChanges.forEach(commit => {
        const scopeText = commit.scope ? `**${commit.scope}**: ` : '';
        output += `- ${scopeText}${commit.description}\n`;
      });
      output += '\n';
    }

    // Regular categories
    categories.forEach(category => {
      const categoryCommits = commits.filter(c => c.type === category.type && !c.breakingChange);
      if (categoryCommits.length > 0) {
        output += `### ${category.title}\n\n`;
        
        // Group by scope for better organization
        const byScope = categoryCommits.reduce((acc, commit) => {
          const scope = commit.scope || 'general';
          if (!acc[scope]) acc[scope] = [];
          acc[scope].push(commit);
          return acc;
        }, {} as Record<string, CommitAnalysis[]>);

        Object.entries(byScope).forEach(([scope, scopeCommits]) => {
          if (scope !== 'general' && Object.keys(byScope).length > 1) {
            output += `#### ${scope.charAt(0).toUpperCase() + scope.slice(1)}\n`;
          }
          
          scopeCommits.forEach(commit => {
            const prefix = scope === 'general' && Object.keys(byScope).length > 1 ? 
              (commit.scope ? `**${commit.scope}**: ` : '') : '';
            output += `- ${category.emoji} ${prefix}${commit.description}\n`;
          });
          
          if (scope !== 'general' && Object.keys(byScope).length > 1) {
            output += '\n';
          }
        });
        output += '\n';
      }
    });

    return output;
  }

  public async generateAdvancedChangelog(version: string, commitMessages: string): Promise<string> {
    console.log('Generating advanced changelog for version:', version);
    
    // Get context from previous changelogs
    const context = await this.getChangelogContext();
    
    // Parse and analyze commits
    const commitLines = commitMessages.split('\n').filter(line => line.trim());
    const analyzedCommits = this.analyzeCommits(commitLines);
    
    if (analyzedCommits.length === 0) {
      return `## Version ${version}\n\nNo changes recorded for this version.`;
    }

    // Generate contextual changelog
    let changelog = this.generateContextualIntro(version, context, analyzedCommits);
    changelog += this.categorizeAndFormatChanges(analyzedCommits);
    
    // Add footer with context
    const totalChanges = analyzedCommits.length;
    const hasBreaking = analyzedCommits.some(c => c.breakingChange);
    
    changelog += `---\n\n`;
    
    if (hasBreaking) {
      changelog += `**Migration Guide**: Please review the breaking changes above and update your implementation accordingly.\n\n`;
    }
    
    changelog += `**Release Notes**: This version includes ${totalChanges} change${totalChanges > 1 ? 's' : ''} across multiple areas of the application.\n`;
    
    // Add trending focus areas if available
    if (context.recentTrends.focusAreas.length > 0) {
      changelog += `We continue to focus on ${context.recentTrends.focusAreas.join(', ')} improvements.\n`;
    }
    
    return changelog;
  }
}

export const changelogGenerator = new AdvancedChangelogGenerator();
