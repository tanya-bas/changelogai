
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Database } from "lucide-react";
import { useEmbeddingManager } from "@/hooks/useEmbeddingManager";

export const EmbeddingManager = () => {
  const { isReEmbedding, embeddingCount, reEmbedAllChangelogs, refreshEmbeddingCount } = useEmbeddingManager();

  useEffect(() => {
    refreshEmbeddingCount();
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Vector Embedding Management
        </CardTitle>
        <CardDescription>
          Manage changelog embeddings for semantic search functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
          <div>
            <p className="font-medium">Current Embeddings</p>
            <p className="text-sm text-slate-600">
              {embeddingCount !== null ? `${embeddingCount} changelogs embedded` : 'Loading...'}
            </p>
          </div>
          <Button onClick={refreshEmbeddingCount} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          <Button 
            onClick={reEmbedAllChangelogs} 
            disabled={isReEmbedding}
            className="w-full"
          >
            {isReEmbedding ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Re-embedding All Changelogs...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Re-embed All Changelogs
              </>
            )}
          </Button>
          <p className="text-xs text-slate-500 text-center">
            This will clear existing embeddings and re-process all changelogs
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
