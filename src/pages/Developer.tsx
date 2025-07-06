
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useChangelogGenerator } from "@/hooks/useChangelogGenerator";
import AuthForm from "@/components/AuthForm";
import { DeveloperHeader } from "@/components/DeveloperHeader";
import { ChangelogInput } from "@/components/ChangelogInput";
import { ChangelogOutput } from "@/components/ChangelogOutput";

const Developer = () => {
  const [version, setVersion] = useState("");
  const [commits, setCommits] = useState("");
  const { user, loading } = useAuth();
  const {
    generatedChangelog,
    isGenerating,
    isModelLoading,
    generateChangelog
  } = useChangelogGenerator();

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

  const handleGenerate = () => {
    generateChangelog(version, commits);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <DeveloperHeader />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-4">Generate Your AI-Enhanced Changelog</h1>
            <p className="text-lg text-slate-600">
              Transform your commit messages into beautiful, user-friendly changelogs using local AI - no API key required!
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <ChangelogInput
              version={version}
              setVersion={setVersion}
              commits={commits}
              setCommits={setCommits}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              isModelLoading={isModelLoading}
            />

            <ChangelogOutput generatedChangelog={generatedChangelog} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Developer;
