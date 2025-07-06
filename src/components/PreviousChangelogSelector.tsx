import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Clock, Package } from "lucide-react";

interface ChangelogSearchResult {
  id: string;
  content: string;
  embedding: number[];
  version: string;
  product?: string;
  created_at: string;
  changelog_id: number;
  similarity: number;
}

interface PreviousChangelogSelectorProps {
  commits: string;
  onSelectionChange: (selectedChangelogs: ChangelogSearchResult[]) => void;
  searchSimilarChangelogs: (query: string, limit?: number) => Promise<ChangelogSearchResult[]>;
  isSearching: boolean;
}

export const PreviousChangelogSelector = ({
  commits,
  onSelectionChange,
  searchSimilarChangelogs,
  isSearching
}: PreviousChangelogSelectorProps) => {
  const [relevantChangelogs, setRelevantChangelogs] = useState<ChangelogSearchResult[]>([]);
  const [selectedChangelogs, setSelectedChangelogs] = useState<Set<string>>(new Set());
  
  // Use a ref to store the latest callback to avoid dependency issues
  const onSelectionChangeRef = useRef(onSelectionChange);
  onSelectionChangeRef.current = onSelectionChange;

  const searchForRelevantChangelogs = useCallback(async () => {
    if (!commits.trim()) {
      setRelevantChangelogs([]);
      setSelectedChangelogs(new Set());
      onSelectionChangeRef.current([]);
      return;
    }

    try {
      const results = await searchSimilarChangelogs(commits, 3);
      setRelevantChangelogs(results);
      
      // Auto-select all by default
      const allIds = new Set(results.map(r => r.id));
      setSelectedChangelogs(allIds);
      onSelectionChangeRef.current(results);
    } catch (error) {
      console.error('Failed to search for relevant changelogs:', error);
    }
  }, [commits, searchSimilarChangelogs]);

  useEffect(() => {
    // Debounce the search
    const timeoutId = setTimeout(searchForRelevantChangelogs, 500);
    return () => clearTimeout(timeoutId);
  }, [searchForRelevantChangelogs]);

  const handleCheckboxChange = (changelogId: string, checked: boolean) => {
    const newSelectedChangelogs = new Set(selectedChangelogs);
    
    if (checked) {
      newSelectedChangelogs.add(changelogId);
    } else {
      newSelectedChangelogs.delete(changelogId);
    }
    
    setSelectedChangelogs(newSelectedChangelogs);
    
    const selectedChangelogObjects = relevantChangelogs.filter(
      changelog => newSelectedChangelogs.has(changelog.id)
    );
    onSelectionChangeRef.current(selectedChangelogObjects);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  if (!commits.trim()) {
    return null;
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Similar Previous Changelogs
        </CardTitle>
        <CardDescription>
          Select which previous changelogs to use as context for generation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isSearching ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mr-3"></div>
            <span className="text-slate-600">Finding relevant changelogs...</span>
          </div>
        ) : relevantChangelogs.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            No similar changelogs found. Your changelog will be generated without historical context.
          </div>
        ) : (
          <div className="space-y-3">
            {relevantChangelogs.map((changelog) => (
              <div
                key={changelog.id}
                className="border rounded-lg p-4 space-y-3 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    id={`changelog-${changelog.id}`}
                    checked={selectedChangelogs.has(changelog.id)}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange(changelog.id, checked as boolean)
                    }
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary">v{changelog.version}</Badge>
                      {changelog.product && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {changelog.product}
                        </Badge>
                      )}
                      <span className="text-sm text-slate-500">
                        {formatDate(changelog.created_at)}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(changelog.similarity * 100)}% match
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {truncateContent(changelog.content)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="text-xs text-slate-500 mt-4">
              Selected {selectedChangelogs.size} of {relevantChangelogs.length} changelogs for context
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
