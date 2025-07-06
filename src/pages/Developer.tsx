import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useChangelogGenerator } from "@/hooks/useChangelogGenerator";
import { useSemanticSearch } from "@/hooks/useSemanticSearch";
import { supabase } from "@/integrations/supabase/client";
import { changelogEmbeddingService } from "@/services/changelogEmbedding";
import { toast } from "sonner";
import AuthForm from "@/components/AuthForm";
import { DeveloperHeader } from "@/components/DeveloperHeader";
import { ChangelogInput } from "@/components/ChangelogInput";
import { ChangelogOutput } from "@/components/ChangelogOutput";
import { PreviousChangelogSelector } from "@/components/PreviousChangelogSelector";

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

const Developer = () => {
  const [version, setVersion] = useState("");
  const [commits, setCommits] = useState("");
  const [product, setProduct] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [selectedPreviousChangelogs, setSelectedPreviousChangelogs] = useState<ChangelogSearchResult[]>([]);
  
  const { user, loading } = useAuth();
  const { searchSimilarChangelogs, isSearching } = useSemanticSearch();
  const {
    generatedChangelog,
    isGenerating,
    generateChangelog
  } = useChangelogGenerator();

  const handleGenerate = () => {
    generateChangelog(version, commits, selectedPreviousChangelogs);
  };

  const handlePreviousChangelogSelection = (changelogs: ChangelogSearchResult[]) => {
    setSelectedPreviousChangelogs(changelogs);
  };

  const handlePublish = async (changelog: string, productName: string) => {
    if (!version.trim() || !changelog.trim()) {
      toast.error("Please ensure both version and changelog are provided");
      return;
    }

    if (!user) {
      toast.error("You must be signed in to publish a changelog");
      return;
    }

    setIsPublishing(true);
    
    try {
      console.log('Publishing changelog for user:', user.id);
      const { data: newChangelog, error } = await supabase
        .from('changelogs')
        .insert({
          version: version.trim(),
          content: changelog,
          commits: commits,
          user_id: user.id,
          product: productName || null
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Changelog published successfully');
      
      // Try to embed the changelog for search
      try {
        await changelogEmbeddingService.embedChangelog(newChangelog);
        console.log('Changelog embedded successfully');
        toast.success("Changelog published and indexed for search!");
      } catch (embeddingError) {
        console.error('Failed to embed changelog:', embeddingError);
        // Don't show error to user - embedding is not critical for publishing
        toast.success("Changelog published successfully!");
      }
      
      // Reset the form
      setVersion("");
      setCommits("");
      setProduct("");
      
    } catch (error: any) {
      console.error('Error publishing changelog:', error);
      toast.error("Failed to publish changelog: " + error.message);
    } finally {
      setIsPublishing(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <DeveloperHeader />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-4">Generate Your Changelog</h1>
            <p className="text-lg text-slate-600">
              Transform your commit messages into beautiful, user-friendly changelogs powered by AI
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <ChangelogInput
                version={version}
                setVersion={setVersion}
                commits={commits}
                setCommits={setCommits}
                product={product}
                setProduct={setProduct}
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
              />
              
              <PreviousChangelogSelector
                commits={commits}
                onSelectionChange={handlePreviousChangelogSelection}
                searchSimilarChangelogs={searchSimilarChangelogs}
                isSearching={isSearching}
              />
            </div>

            <ChangelogOutput 
              generatedChangelog={generatedChangelog}
              version={version}
              commits={commits}
              product={product}
              onPublish={handlePublish}
              isPublishing={isPublishing}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Developer;
