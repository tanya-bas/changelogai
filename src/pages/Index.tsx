
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Wrench } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-8">
          <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg"></div>
          <h1 className="text-3xl font-bold">ChangelogAI</h1>
        </div>
        
        <h2 className="text-xl text-slate-600 mb-12">
          AI-Powered Changelog Generation for Developer Tools
        </h2>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <Link to="/changelog">
            <Button size="lg" variant="outline" className="px-8 py-4 text-lg">
              <Users className="mr-2 h-5 w-5" />
              View Changelog
            </Button>
          </Link>
          <Link to="/developer">
            <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 text-lg">
              <Wrench className="mr-2 h-5 w-5" />
              Try Developer Tool
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
