
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const EmailConfirmed = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Handle the email confirmation when the page loads
    const handleEmailConfirmation = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        toast.error('Email confirmation failed');
        return;
      }

      if (data.session) {
        console.log('Email confirmed, user signed in:', data.session.user.email);
        toast.success('Email confirmed successfully!');
        // Redirect to developer page after a short delay
        setTimeout(() => {
          navigate('/developer');
        }, 2000);
      }
    };

    handleEmailConfirmation();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle>Email Confirmed!</CardTitle>
          <CardDescription>
            Your email has been successfully verified and you're now signed in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-sm text-green-800">
              You'll be automatically redirected to the developer dashboard in a moment.
            </p>
          </div>

          <div className="space-y-2">
            <Link to="/developer">
              <Button className="w-full">
                Go to Developer Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            
            <Link to="/">
              <Button variant="ghost" className="w-full">
                Back to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailConfirmed;
