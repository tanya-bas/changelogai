
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Sparkles, Eye, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import AuthForm from "@/components/AuthForm";

const Developer = () => {
  const [version, setVersion] = useState("");
  const [commits, setCommits] = useState("");
  const [generatedChangelog, setGeneratedChangelog] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
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
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const commitLines = commits.split('\n').filter(line => line.trim());
    const changes = {
      features: [] as string[],
      improvements: [] as string[],
      fixes: [] as string[]
    };

    commitLines.forEach(commit => {
      const lower = commit.toLowerCase();
      if (lower.includes('feat') || lower.includes('add') || lower.includes('new')) {
        changes.features.push(extractChangeDescription(commit));
      } else if (lower.includes('fix') || lower.includes('bug') || lower.includes('resolve')) {
        changes.fixes.push(extractChangeDescription(commit));
      } else {
        changes.improvements.push(extractChangeDescription(commit));
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

    setGeneratedChangelog(changelog);
    setIsGenerating(false);
    toast.success("Changelog generated successfully!");
  };

  const extractChangeDescription = (commit: string): string => {
    let description = commit
      .replace(/^(feat|fix|chore|docs|style|refactor|test)(\(.+\))?:\s*/i, '')
      .replace(/^Merge .+/, '')
      .trim();
    
    if (description) {
      description = description.charAt(0).toUpperCase() + description.slice(1);
    }
    
    return description || 'Miscellaneous updates';
  };

  const publishChangelog = async () => {
    if (!generatedChangelog) {
      toast.error("Generate a changelog first");
      return;
    }

    try {
      // First, check if the changelogs table exists by trying to insert
      const { error } = await supabase
        .from('changelogs')
        .insert([
          {
            version,
            content: generatedChangelog,
            commits: commits,
            user_id: user.id
          }
        ]);

      if (error) {
        console.error('Database error:', error);
        // If table doesn't exist, show a helpful message
        if (error.code === '42P01') {
          toast.error("Database not set up yet. Please create the changelogs table in Supabase first.");
        } else {
          toast.error("Failed to publish changelog: " + error.message);
        }
        return;
      }

      toast.success("Changelog published successfully!");
      
      setVersion("");
      setCommits("");
      setGeneratedChangelog("");
    } catch (error: any) {
      toast.error("Failed to publish changelog: " + error.message);
    }
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
            <h1 className="text-3xl font-bold text-slate-900 mb-4">Generate Your Changelog</h1>
            <p className="text-lg text-slate-600">
              Paste your commits below and let AI create a user-friendly changelog
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
feat: add user authentication
fix: resolve login redirect issue
chore: update dependencies
feat(ui): improve dashboard layout`}
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
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Changelog
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Generated Changelog</CardTitle>
                <CardDescription>
                  AI-generated user-friendly changelog
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
                    <Button onClick={publishChangelog} className="w-full">
                      Publish to Public Changelog
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <Sparkles className="mx-auto h-12 w-12 mb-4 text-slate-300" />
                    <p>Your generated changelog will appear here</p>
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
