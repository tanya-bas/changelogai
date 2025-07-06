import { supabase } from '@/integrations/supabase/client';

export interface CommitAnalysis {
  type: 'feat' | 'fix' | 'perf' | 'refactor' | 'docs' | 'style' | 'test' | 'chore';
  scope?: string;
  description: string;
  breakingChange: boolean;
  impact: 'major' | 'minor' | 'patch';
  enhancedDescription?: string;
  businessImpact?: string;
  technicalDetails?: string;
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

  private enhanceCommitDescription(commit: CommitAnalysis): CommitAnalysis {
    const originalDesc = commit.description.toLowerCase();
    
    // Business impact patterns
    const businessImpactMap: Record<string, string> = {
      'login': 'Improves user authentication experience and security',
      'dashboard': 'Enhances user productivity and data visibility',
      'performance': 'Reduces load times and improves user experience',
      'api': 'Streamlines integration capabilities for developers',
      'mobile': 'Optimizes experience for mobile users',
      'search': 'Helps users find information more efficiently',
      'notification': 'Keeps users informed with timely updates',
      'export': 'Enables better data portability and reporting',
      'upload': 'Simplifies file management workflows',
      'filter': 'Allows users to find relevant content faster',
      'sort': 'Improves data organization and accessibility',
      'validation': 'Prevents errors and improves data quality',
      'cache': 'Delivers faster response times across the platform',
      'database': 'Ensures reliable data storage and retrieval',
      'security': 'Strengthens platform security and user privacy',
      'oauth': 'Simplifies login process with social authentication',
      'sso': 'Streamlines access management for enterprise users',
      'analytics': 'Provides better insights into user behavior and trends'
    };

    // Technical enhancement patterns
    const technicalEnhancementMap: Record<string, string> = {
      'refactor': 'Code restructuring improves maintainability and performance',
      'optimize': 'Algorithm improvements reduce resource usage',
      'migrate': 'Infrastructure updates ensure better scalability',
      'typescript': 'Type safety improvements reduce runtime errors',
      'test': 'Expanded test coverage ensures reliability',
      'eslint': 'Code quality improvements maintain consistency',
      'webpack': 'Build optimization reduces bundle size',
      'react': 'Component updates leverage latest framework features',
      'api endpoint': 'Backend improvements enhance data processing',
      'database query': 'Query optimization improves response times',
      'memory leak': 'Memory management fixes ensure stable performance',
      'concurrent': 'Parallel processing improvements boost throughput'
    };

    // Context-aware enhancement based on commit type and content
    let enhancedDescription = commit.description;
    let businessImpact = '';
    let technicalDetails = '';

    // Find relevant business impact
    Object.entries(businessImpactMap).forEach(([keyword, impact]) => {
      if (originalDesc.includes(keyword)) {
        businessImpact = impact;
      }
    });

    // Find relevant technical details
    Object.entries(technicalEnhancementMap).forEach(([keyword, detail]) => {
      if (originalDesc.includes(keyword)) {
        technicalDetails = detail;
      }
    });

    // Generate enhanced descriptions based on commit type
    switch (commit.type) {
      case 'feat':
        if (originalDesc.includes('auth') || originalDesc.includes('login')) {
          enhancedDescription = `Introduced ${commit.scope ? `${commit.scope} ` : ''}authentication system with secure token management and session handling`;
          businessImpact = businessImpact || 'Users can now securely access their accounts with improved login experience';
          technicalDetails = technicalDetails || 'Implements JWT-based authentication with automatic token refresh';
        } else if (originalDesc.includes('dashboard') || originalDesc.includes('ui')) {
          enhancedDescription = `Enhanced ${commit.scope ? `${commit.scope} ` : ''}user interface with improved navigation and visual design`;
          businessImpact = businessImpact || 'Users benefit from a more intuitive and efficient workflow';
          technicalDetails = technicalDetails || 'Modern React components with responsive design patterns';
        } else if (originalDesc.includes('api') || originalDesc.includes('endpoint')) {
          enhancedDescription = `Expanded API capabilities with new ${commit.scope ? `${commit.scope} ` : ''}endpoints for enhanced functionality`;
          businessImpact = businessImpact || 'Developers can integrate new features into their applications';
          technicalDetails = technicalDetails || 'RESTful API design with comprehensive error handling';
        } else {
          enhancedDescription = `Added ${commit.scope ? `${commit.scope} ` : ''}functionality: ${commit.description.toLowerCase()}`;
          businessImpact = businessImpact || 'Expands platform capabilities for improved user productivity';
        }
        break;

      case 'fix':
        if (originalDesc.includes('crash') || originalDesc.includes('error')) {
          enhancedDescription = `Resolved critical ${commit.scope ? `${commit.scope} ` : ''}stability issue that could cause application crashes`;
          businessImpact = businessImpact || 'Users experience more reliable application performance';
          technicalDetails = technicalDetails || 'Improved error handling and exception management';
        } else if (originalDesc.includes('memory') || originalDesc.includes('leak')) {
          enhancedDescription = `Fixed ${commit.scope ? `${commit.scope} ` : ''}memory management issue preventing resource leaks`;
          businessImpact = businessImpact || 'Application runs more smoothly with better resource utilization';
          technicalDetails = technicalDetails || 'Optimized memory allocation and garbage collection';
        } else if (originalDesc.includes('security') || originalDesc.includes('vulnerability')) {
          enhancedDescription = `Patched ${commit.scope ? `${commit.scope} ` : ''}security vulnerability to protect user data`;
          businessImpact = businessImpact || 'Enhanced security protects user information and privacy';
          technicalDetails = technicalDetails || 'Applied security best practices and input validation';
        } else {
          enhancedDescription = `Corrected ${commit.scope ? `${commit.scope} ` : ''}issue: ${commit.description.toLowerCase()}`;
          businessImpact = businessImpact || 'Improves application reliability and user experience';
        }
        break;

      case 'perf':
        if (originalDesc.includes('database') || originalDesc.includes('query')) {
          enhancedDescription = `Optimized ${commit.scope ? `${commit.scope} ` : ''}database queries for faster data retrieval`;
          businessImpact = businessImpact || 'Users experience significantly faster page load times';
          technicalDetails = technicalDetails || 'Implemented query optimization and database indexing';
        } else if (originalDesc.includes('bundle') || originalDesc.includes('build')) {
          enhancedDescription = `Reduced application ${commit.scope ? `${commit.scope} ` : ''}bundle size through build optimization`;
          businessImpact = businessImpact || 'Faster initial page loads, especially on slower connections';
          technicalDetails = technicalDetails || 'Code splitting and tree shaking improvements';
        } else {
          enhancedDescription = `Enhanced ${commit.scope ? `${commit.scope} ` : ''}performance: ${commit.description.toLowerCase()}`;
          businessImpact = businessImpact || 'Delivers faster response times and smoother interactions';
        }
        break;

      case 'refactor':
        enhancedDescription = `Restructured ${commit.scope ? `${commit.scope} ` : ''}codebase for improved maintainability: ${commit.description.toLowerCase()}`;
        businessImpact = businessImpact || 'Enables faster feature development and more reliable updates';
        technicalDetails = technicalDetails || 'Code organization improvements following best practices';
        break;

      default:
        enhancedDescription = commit.description;
    }

    return {
      ...commit,
      enhancedDescription,
      businessImpact,
      technicalDetails
    };
  }

  private analyzeCommits(commits: string[]): CommitAnalysis[] {
    const basicAnalysis = commits.map(commit => {
      const trimmed = commit.trim();
      if (!trimmed) return null;

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
        
        description = description
          .replace(/^(feat|fix|add|new|bug|resolve|perf|optimize|refactor)(\(.+\))?:\s*/i, '')
          .replace(/^Merge .+/, 'Code integration')
          .trim();
      }

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

    // Enhance each commit with detailed descriptions
    return basicAnalysis.map(commit => this.enhanceCommitDescription(commit));
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
        output += `- ${scopeText}${commit.enhancedDescription || commit.description}\n`;
        if (commit.businessImpact) {
          output += `  - *Impact*: ${commit.businessImpact}\n`;
        }
        if (commit.technicalDetails) {
          output += `  - *Technical*: ${commit.technicalDetails}\n`;
        }
        output += '\n';
      });
    }

    // Regular categories with enhanced formatting
    categories.forEach(category => {
      const categoryCommits = commits.filter(c => c.type === category.type && !c.breakingChange);
      if (categoryCommits.length > 0) {
        output += `### ${category.title}\n\n`;
        
        const byScope = categoryCommits.reduce((acc, commit) => {
          const scope = commit.scope || 'general';
          if (!acc[scope]) acc[scope] = [];
          acc[scope].push(commit);
          return acc;
        }, {} as Record<string, CommitAnalysis[]>);

        Object.entries(byScope).forEach(([scope, scopeCommits]) => {
          if (scope !== 'general' && Object.keys(byScope).length > 1) {
            output += `#### ${scope.charAt(0).toUpperCase() + scope.slice(1)}\n\n`;
          }
          
          scopeCommits.forEach(commit => {
            const prefix = scope === 'general' && Object.keys(byScope).length > 1 ? 
              (commit.scope ? `**${commit.scope}**: ` : '') : '';
            
            // Use enhanced description if available
            const mainDescription = commit.enhancedDescription || commit.description;
            output += `- ${category.emoji} ${prefix}${mainDescription}\n`;
            
            // Add business impact and technical details
            if (commit.businessImpact && category.type !== 'docs') {
              output += `  - *User Benefit*: ${commit.businessImpact}\n`;
            }
            if (commit.technicalDetails && (category.type === 'perf' || category.type === 'refactor' || category.type === 'fix')) {
              output += `  - *Technical Details*: ${commit.technicalDetails}\n`;
            }
            output += '\n';
          });
          
          if (scope !== 'general' && Object.keys(byScope).length > 1) {
            output += '\n';
          }
        });
      }
    });

    return output;
  }

  public async generateAdvancedChangelog(version: string, commitMessages: string): Promise<string> {
    console.log('Generating advanced changelog for version:', version);
    
    const context = await this.getChangelogContext();
    const commitLines = commitMessages.split('\n').filter(line => line.trim());
    const analyzedCommits = this.analyzeCommits(commitLines);
    
    if (analyzedCommits.length === 0) {
      return `## Version ${version}\n\nNo changes recorded for this version.`;
    }

    let changelog = this.generateContextualIntro(version, context, analyzedCommits);
    changelog += this.categorizeAndFormatChanges(analyzedCommits);
    
    // Enhanced footer with more context
    const totalChanges = analyzedCommits.length;
    const hasBreaking = analyzedCommits.some(c => c.breakingChange);
    const featCount = analyzedCommits.filter(c => c.type === 'feat').length;
    const perfCount = analyzedCommits.filter(c => c.type === 'perf').length;
    
    changelog += `---\n\n`;
    
    if (hasBreaking) {
      changelog += `**Migration Guide**: Please review the breaking changes above and update your implementation accordingly. Check our migration documentation for detailed upgrade instructions.\n\n`;
    }
    
    changelog += `**Release Summary**: This release delivers ${totalChanges} enhancement${totalChanges > 1 ? 's' : ''} across the platform`;
    
    if (featCount > 0 || perfCount > 0) {
      const improvements = [];
      if (featCount > 0) improvements.push(`${featCount} new feature${featCount > 1 ? 's' : ''}`);
      if (perfCount > 0) improvements.push(`${perfCount} performance optimization${perfCount > 1 ? 's' : ''}`);
      changelog += `, including ${improvements.join(' and ')}`;
    }
    
    changelog += `. `;
    
    if (context.recentTrends.focusAreas.length > 0) {
      changelog += `Our continued focus on ${context.recentTrends.focusAreas.join(', ')} ensures we're building features that matter most to our users.`;
    } else {
      changelog += `We remain committed to delivering reliable, performant, and user-focused improvements.`;
    }
    
    return changelog;
  }
}

export const changelogGenerator = new AdvancedChangelogGenerator();
