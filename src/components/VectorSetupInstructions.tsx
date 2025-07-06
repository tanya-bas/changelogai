
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";

export const VectorSetupInstructions = () => {
  const sqlSetup = `-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the changelog_embeddings table
CREATE TABLE IF NOT EXISTS changelog_embeddings (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  embedding vector(384), -- Adjust dimension based on your embedding model
  version TEXT NOT NULL,
  product TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  changelog_id INTEGER NOT NULL REFERENCES changelogs(id) ON DELETE CASCADE,
  created_at_embedding TIMESTAMPTZ DEFAULT NOW()
);

-- Create an index for similarity search
CREATE INDEX IF NOT EXISTS changelog_embeddings_embedding_idx 
ON changelog_embeddings USING ivfflat (embedding vector_cosine_ops);

-- Create a function for similarity search
CREATE OR REPLACE FUNCTION search_similar_changelogs(
  query_embedding vector(384),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id text,
  content text,
  embedding vector(384),
  version text,
  product text,
  created_at timestamptz,
  changelog_id integer,
  similarity float
)
LANGUAGE sql
AS $$
  SELECT
    id,
    content,
    embedding,
    version,
    product,
    created_at,
    changelog_id,
    1 - (embedding <=> query_embedding) AS similarity
  FROM changelog_embeddings
  WHERE 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlSetup);
    toast.success("SQL setup copied to clipboard!");
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Supabase Vector Setup Required</CardTitle>
        <CardDescription>
          To enable vector storage with pgvector, run this SQL in your Supabase SQL editor
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={copyToClipboard} size="sm" variant="outline">
              <Copy className="h-4 w-4 mr-2" />
              Copy SQL
            </Button>
          </div>
          <pre className="bg-slate-100 p-4 rounded-lg text-sm overflow-x-auto">
            <code>{sqlSetup}</code>
          </pre>
          <div className="text-sm text-slate-600">
            <p><strong>Steps:</strong></p>
            <ol className="list-decimal list-inside space-y-1 mt-2">
              <li>Go to your Supabase project dashboard</li>
              <li>Navigate to the SQL Editor</li>
              <li>Paste and run the SQL above</li>
              <li>This will create the necessary table and functions for vector storage</li>
            </ol>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
