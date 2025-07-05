
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Mail, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EmailConfirmationProps {
  email: string;
  onBackToLogin: () => void;
}

const EmailConfirmation = ({ email, onBackToLogin }: EmailConfirmationProps) => {
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    // Listen for auth state changes to handle email confirmation
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          toast.success('Email confirmed! Welcome!');
          onBackToLogin();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [onBackToLogin]);

  const resendConfirmation = async () => {
    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      
      if (error) throw error;
      
      toast.success('Confirmation email resent!');
    } catch (error: any) {
      toast.error('Failed to resend email: ' + error.message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
          <Mail className="h-6 w-6 text-blue-600" />
        </div>
        <CardTitle>Check Your Email</CardTitle>
        <CardDescription>
          We've sent a confirmation link to <strong>{email}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">What to do next:</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-700">
                <li>Check your email inbox (and spam folder)</li>
                <li>Click the confirmation link in the email</li>
                <li>You'll be automatically signed in</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Button
            variant="outline"
            onClick={resendConfirmation}
            disabled={isResending}
            className="w-full"
          >
            {isResending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Resending...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Resend Confirmation Email
              </>
            )}
          </Button>
          
          <Button variant="ghost" onClick={onBackToLogin} className="w-full">
            Back to Sign In
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailConfirmation;
