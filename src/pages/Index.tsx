
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Users, Wrench } from "lucide-react";

const Index = () => {
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
            <nav className="flex items-center space-x-4">
              <Link to="/changelog" className="text-slate-600 hover:text-slate-900 transition-colors">
                Public Changelog
              </Link>
              <Link to="/developer">
                <Button variant="outline">Developer Tool</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-slate-900 mb-6 leading-tight">
            AI-Powered Changelog Generation for Developer Tools
          </h1>
          <p className="text-xl text-slate-600 mb-8 leading-relaxed">
            Transform your commit history into beautiful, user-friendly changelogs in seconds. 
            Stop spending hours writing updates and let AI do the heavy lifting.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/developer">
              <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3">
                <Wrench className="mr-2 h-5 w-5" />
                Try Developer Tool
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/changelog">
              <Button size="lg" variant="outline" className="px-8 py-3">
                <Users className="mr-2 h-5 w-5" />
                View Public Changelog
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center text-slate-900">
                <Wrench className="mr-3 h-6 w-6 text-blue-500" />
                Developer-First Experience
              </CardTitle>
              <CardDescription className="text-base">
                Paste your commits, get instant AI-generated summaries. No complex setup, no learning curve.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-slate-600">
                <li>• Intelligent commit parsing</li>
                <li>• User-focused language generation</li>
                <li>• One-click publishing</li>
                <li>• Real-time preview</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center text-slate-900">
                <Users className="mr-3 h-6 w-6 text-purple-500" />
                Beautiful Public Display
              </CardTitle>
              <CardDescription className="text-base">
                Clean, chronological changelog that your users will actually want to read.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-slate-600">
                <li>• Responsive design</li>
                <li>• Semantic versioning support</li>
                <li>• Category organization</li>
                <li>• Search and filtering</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-slate-600">
            <p>Built for developers who care about great communication</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
