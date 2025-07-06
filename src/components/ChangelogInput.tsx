
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";

interface ChangelogInputProps {
  version: string;
  setVersion: (version: string) => void;
  commits: string;
  setCommits: (commits: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  isModelLoading: boolean;
}

export const ChangelogInput = ({
  version,
  setVersion,
  commits,
  setCommits,
  onGenerate,
  isGenerating,
  isModelLoading
}: ChangelogInputProps) => {
  return (
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
          onClick={onGenerate} 
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
  );
};
