
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ChangelogEntry {
  id: number;
  version: string;
  content: string;
  created_at: string;
  commits: string;
}

const Changelog = () => {
  const [changelogs, setChangelogs] = useState<ChangelogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChangelogs();
  }, []);

  const fetchChangelogs = async () => {
    try {
      const { data, error } = await supabase
        .from('changelogs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChangelogs(data || []);
    } catch (error) {
      console.error('Error fetching changelogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredChangelogs = changelogs.filter(changelog =>
    changelog.version.toLowerCase().includes(searchTerm.toLowerCase()) ||
    changelog.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderMarkdown = (content: string) => {
    return content
      .split('\n')
      .map((line, index) => {
        if (line.startsWith('## ')) {
          return <h2 key={index} className="text-2xl font-bold text-slate-900 mb-4">{line.replace('## ', '')}</h2>;
        }
        if (line.startsWith('### ')) {
          return <h3 key={index} className="text-lg font-semibold text-slate-800 mb-2 mt-4">{line.replace('### ', '')}</h3>;
        }
        if (line.startsWith('- ')) {
          return <li key={index} className="text-slate-700 mb-1">{line.replace('- ', '')}</li>;
        }
        if (line.trim() === '') {
          return <br key={index} />;
        }
        return <p key={index} className="text-slate-700 mb-2">{line}</p>;
      });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Loading changelogs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Home</span>
            </Link>
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg"></div>
              <h1 className="text-xl font-bold">Public Changelog</h1>
            </div>
            <Link to="/developer">
              <Button variant="outline">
                <Wrench className="mr-2 h-4 w-4" />
                Developer Tool
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-4">Product Updates</h1>
            <p className="text-lg text-slate-600 mb-8">
              Stay up to date with the latest features, improvements, and fixes
            </p>
            
            {/* Search */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Search changelogs..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Changelog Entries */}
          <div className="space-y-8">
            {filteredChangelogs.length > 0 ? (
              filteredChangelogs.map((changelog) => (
                <Card key={changelog.id} className="shadow-lg border-0 hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-slate-900">
                          Version {changelog.version}
                        </h2>
                        <p className="text-slate-600">
                          Released on {formatDate(changelog.created_at)}
                        </p>
                      </div>
                      <div className="text-sm text-slate-500 bg-white px-3 py-1 rounded-full">
                        Latest
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="prose prose-slate max-w-none">
                      {renderMarkdown(changelog.content)}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : changelogs.length === 0 ? (
              <Card className="shadow-lg border-0">
                <CardContent className="p-12 text-center">
                  <div className="text-slate-400 mb-4">
                    <Wrench className="mx-auto h-16 w-16 mb-4" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-700 mb-2">
                    No changelogs yet
                  </h3>
                  <p className="text-slate-600 mb-6">
                    Use the developer tool to generate and publish your first changelog
                  </p>
                  <Link to="/developer">
                    <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                      <Wrench className="mr-2 h-4 w-4" />
                      Create First Changelog
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-lg border-0">
                <CardContent className="p-12 text-center">
                  <Search className="mx-auto h-16 w-16 text-slate-300 mb-4" />
                  <h3 className="text-xl font-semibold text-slate-700 mb-2">
                    No results found
                  </h3>
                  <p className="text-slate-600">
                    Try adjusting your search terms
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Changelog;
