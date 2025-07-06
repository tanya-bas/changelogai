
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText } from "lucide-react";

interface ChangelogInputProps {
  version: string;
  setVersion: (version: string) => void;
  commits: string;
  setCommits: (commits: string) => void;
  product: string;
  setProduct: (product: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export const ChangelogInput = ({
  version,
  setVersion,
  commits,
  setCommits,
  product,
  setProduct,
  onGenerate,
  isGenerating
}: ChangelogInputProps) => {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Input</CardTitle>
        <CardDescription>
          Enter your version number, product, and commit messages
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
          <Label htmlFor="product">Product (Optional)</Label>
          <Input
            id="product"
            placeholder="e.g., Web App, Mobile App, API"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
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
              Generating...
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              Generate Changelog
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
