
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Zap } from "lucide-react";
import { useSemanticSearch } from "@/hooks/useSemanticSearch";

export const SemanticSearchSetup = () => {
  const { isEmbedding, embedAllChangelogs } = useSemanticSearch();

  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Semantic Search Setup
        </CardTitle>
        <CardDescription>
          Initialize vector embeddings for existing changelogs to enable semantic search
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            This will process all existing changelogs and create vector embeddings for semantic search. 
            This enables the AI to find relevant historical context when generating new changelogs.
          </p>
          
          <Button 
            onClick={embedAllChangelogs}
            disabled={isEmbedding}
            className="w-full"
          >
            {isEmbedding ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Processing Changelogs...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Initialize Semantic Search
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
