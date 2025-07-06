
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Sparkles, LogOut, Eye } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import AuthForm from "@/components/AuthForm";
import { pipeline } from "@huggingface/transformers";

const Developer = () => {
  const [version, setVersion] = useState("");
  const [commits, setCommits] = useState("");
  const [generatedChangelog, setGeneratedChangelog] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <header className="border-b bg-white/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors">
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Home</span>
              </Link>
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg"></div>
                <h1 className="text-xl font-bold">Developer Tool</h1>
              </div>
            </div>
          </div>
        </header>
        
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-4">Developer Access Required</h1>
            <p className="text-lg text-slate-600 mb-8">
              Sign in to access the changelog generation tool
            </p>
          </div>
          <AuthForm />
        </div>
      </div>
    );
  }

  const generateChangelog = async () => {
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

      const changelog = result[0]?.generated_text?.replace(prompt, '').trim() || '';

      if (changelog) {
        // Clean up the generated text and format it properly
        const cleanedChangelog = `## Version ${version}\n\n${changelog}`;
        setGeneratedChangelog(cleanedChangelog);
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

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
    } catch (error: any) {
      toast.error("Failed to sign out: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Home</span>
            </Link>
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg"></div>
              <h1 className="text-xl font-bold">Developer Tool</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-600">{user.email}</span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
              <Link to="/changelog">
                <Button variant="outline">
                  <Eye className="mr-2 h-4 w-4" />
                  View Public Changelog
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-4">Generate Your AI-Enhanced Changelog</h1>
            <p className="text-lg text-slate-600">
              Transform your commit messages into beautiful, user-friendly changelogs using local AI - no API key required!
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Input</CardTitle>
                <CardDescription>
                  Enter your version number and commit messages
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="version">Version Number</Label>
                  <Input
                    id="version"
                    placeholder="e.g., 2.1.0"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="commits">Commit Messages</Label>
                  <Textarea
                    id="commits"
                    placeholder={`Paste your commits here, e.g.:
feat(auth): add OAuth integration
fix: resolve dashboard loading issue
perf: optimize database queries
feat(ui): improve mobile responsiveness`}
                    className="min-h-[300px]"
                    value={commits}
                    onChange={(e) => setCommits(e.target.value)}
                  />
                </div>

                <Button 
                  onClick={generateChangelog} 
                  className="w-full"
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      {isModelLoading ? 'Loading AI Model...' : 'Generating...'}
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate AI Changelog
                    </>
                  )}
                </Button>
                
                <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded">
                  <p className="font-medium mb-1">✨ Powered by Local AI</p>
                  <p>Uses Hugging Face transformers running locally in your browser. The first generation may take longer as the model downloads.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Generated Changelog</CardTitle>
                <CardDescription>
                  Your AI-enhanced, user-friendly changelog
                </CardDescription>
              </CardHeader>
              <CardContent>
                {generatedChangelog ? (
                  <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-lg border">
                      <pre className="whitespace-pre-wrap text-sm text-slate-700">
                        {generatedChangelog}
                      </pre>
                    </div>
                    <Button 
                      onClick={() => {
                        navigator.clipboard.writeText(generatedChangelog);
                        toast.success("Changelog copied to clipboard!");
                      }} 
                      className="w-full"
                    >
                      Copy to Clipboard
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <Sparkles className="mx-auto h-12 w-12 mb-4 text-slate-300" />
                    <p>Your AI-generated changelog will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Developer;
