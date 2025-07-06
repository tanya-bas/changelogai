
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

interface ChangelogOutputProps {
  generatedChangelog: string;
}

export const ChangelogOutput = ({ generatedChangelog }: ChangelogOutputProps) => {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedChangelog);
    toast.success("Changelog copied to clipboard!");
  };

  return (
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
              onClick={copyToClipboard} 
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
  );
};
