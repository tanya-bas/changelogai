
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Wrench, Edit, Trash2, Save, X, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { renderMarkdown, highlightText } from "@/lib/utils";

interface ChangelogEntry {
  id: number;
  version: string;
  content: string;
  created_at: string;
  commits: string;
  user_id: string;
  product?: string;
}

const Index = () => {
  const [changelogs, setChangelogs] = useState<ChangelogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [editingVersion, setEditingVersion] = useState("");
  const [editingProduct, setEditingProduct] = useState("");
  const { user } = useAuth();

  const products = Array.from(new Set(changelogs.map(c => c.product).filter(Boolean))) as string[];

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

  const handleEdit = (changelog: ChangelogEntry) => {
    setEditingId(changelog.id);
    setEditingContent(changelog.content);
    setEditingVersion(changelog.version);
    setEditingProduct(changelog.product || "");
  };

  const handleSaveEdit = async (id: number) => {
    try {
      const { error } = await supabase
        .from('changelogs')
        .update({
          version: editingVersion,
          content: editingContent,
          product: editingProduct || null
        })
        .eq('id', id);

      if (error) throw error;

      setChangelogs(changelogs.map(changelog => 
        changelog.id === id 
          ? { ...changelog, version: editingVersion, content: editingContent, product: editingProduct || undefined }
          : changelog
      ));

      setEditingId(null);
      toast.success("Changelog updated successfully!");
    } catch (error: any) {
      console.error('Error updating changelog:', error);
      toast.error("Failed to update changelog: " + error.message);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingContent("");
    setEditingVersion("");
    setEditingProduct("");
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this changelog? This action cannot be undone.")) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from('changelogs')
        .delete()
        .eq('id', id)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error('Delete operation completed but no rows were affected. This may be due to permissions.');
      }

      setChangelogs(prevChangelogs => prevChangelogs.filter(changelog => changelog.id !== id));
      toast.success("Changelog deleted successfully!");
      
    } catch (error: any) {
      console.error('Error deleting changelog:', error);
      toast.error("Failed to delete changelog: " + error.message);
    }
  };

  const filteredChangelogs = changelogs.filter(changelog => {
    const matchesSearch = changelog.version.toLowerCase().includes(searchTerm.toLowerCase()) ||
      changelog.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesProduct = selectedProduct === "all" || changelog.product === selectedProduct;
    
    return matchesSearch && matchesProduct;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
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
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg"></div>
              <h1 className="text-xl font-bold">ChangelogAI</h1>
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
            
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Search changelogs..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="text-slate-400 h-4 w-4" />
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by product" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border shadow-lg">
                    <SelectItem value="all">All Products</SelectItem>
                    {products.map((product) => (
                      <SelectItem key={product} value={product}>
                        {product}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Changelog Entries */}
          <div className="space-y-8">
            {filteredChangelogs.length > 0 ? (
              filteredChangelogs.map((changelog) => (
                <Card key={changelog.id} className="shadow-lg border-0 hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        {editingId === changelog.id ? (
                          <div className="space-y-2">
                            <Input
                              value={editingVersion}
                              onChange={(e) => setEditingVersion(e.target.value)}
                              className="text-xl font-bold"
                              placeholder="Version"
                            />
                            <Input
                              value={editingProduct}
                              onChange={(e) => setEditingProduct(e.target.value)}
                              placeholder="Product name (optional)"
                            />
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 mb-2">
                              <h2 className="text-xl font-bold text-slate-900">
                                Version {highlightText(changelog.version, searchTerm)}
                              </h2>
                              {changelog.product && (
                                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                  {highlightText(changelog.product, searchTerm)}
                                </Badge>
                              )}
                            </div>
                            <p className="text-slate-600">
                              Released on {formatDate(changelog.created_at)}
                            </p>
                          </>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-sm text-slate-500 bg-white px-3 py-1 rounded-full">
                          Latest
                        </div>
                        {user && user.id === changelog.user_id && (
                          <div className="flex space-x-2">
                            {editingId === changelog.id ? (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveEdit(changelog.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <Save className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleCancelEdit}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEdit(changelog)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDelete(changelog.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {editingId === changelog.id ? (
                      <Textarea
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        className="min-h-[300px] bg-white"
                        placeholder="Edit your changelog..."
                      />
                    ) : (
                      <div className="prose prose-slate max-w-none">
                        {renderMarkdown(changelog.content, searchTerm)}
                      </div>
                    )}
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
                    Try adjusting your search terms or filter settings
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

export default Index;
