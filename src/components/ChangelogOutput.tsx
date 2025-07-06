
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Edit, Save, Upload } from "lucide-react";
import { toast } from "sonner";

interface ChangelogOutputProps {
  generatedChangelog: string;
  version: string;
  commits: string;
  product: string;
  onPublish: (changelog: string, product: string) => Promise<void>;
  isPublishing: boolean;
  onClearChangelog: () => void;
}

export const ChangelogOutput = ({ 
  generatedChangelog, 
  version, 
  commits, 
  product,
  onPublish,
  isPublishing,
  onClearChangelog
}: ChangelogOutputProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedChangelog, setEditedChangelog] = useState(generatedChangelog);

  // Update edited changelog when generated changelog changes
  useEffect(() => {
    setEditedChangelog(generatedChangelog);
  }, [generatedChangelog]);

  const handleEdit = () => {
    setEditedChangelog(generatedChangelog);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
    toast.success("Changes saved!");
  };

  const handlePublish = async () => {
    const changelogToPublish = isEditing ? editedChangelog : generatedChangelog;
    try {
      await onPublish(changelogToPublish, product);
      // Clear the changelog fields after successful publishing
      setEditedChangelog("");
      setIsEditing(false);
      onClearChangelog();
    } catch (error) {
      // Error handling is done in the parent component
      console.error('Error in handlePublish:', error);
    }
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
              {isEditing ? (
                <Textarea
                  value={editedChangelog}
                  onChange={(e) => setEditedChangelog(e.target.value)}
                  className="min-h-[300px] bg-white"
                  placeholder="Edit your changelog..."
                />
              ) : (
                <pre className="whitespace-pre-wrap text-sm text-slate-700">
                  {editedChangelog || generatedChangelog}
                </pre>
              )}
            </div>
            
            <div className="flex gap-2">
              {isEditing ? (
                <Button onClick={handleSaveEdit} className="flex-1">
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              ) : (
                <Button onClick={handleEdit} variant="outline" className="flex-1">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              )}
              
              <Button 
                onClick={handlePublish} 
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={isPublishing}
              >
                {isPublishing ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Publishing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Publish Changelog
                  </Button>
                )}
              </Button>
            </div>
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
