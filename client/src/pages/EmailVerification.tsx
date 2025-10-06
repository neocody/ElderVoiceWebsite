import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import MarketingLayout from "@/components/MarketingLayout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";

export default function EmailVerification() {
  const [, setLocation] = useLocation();
  const { resendVerification } = useAuth();
  
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    // Check URL parameters for verification status
    const urlParams = new URLSearchParams(window.location.search);
    const verified = urlParams.get("verified");
    const userEmail = urlParams.get("email");
    
    if (verified === "true") {
      setIsVerified(true);
    }
    
    if (userEmail) {
      setEmail(decodeURIComponent(userEmail));
    }
  }, []);

  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    try {
      await resendVerification.mutateAsync(email);
      setSuccess("Verification email sent! Please check your inbox.");
    } catch (err: any) {
      setError(err.message || "Failed to send verification email");
    }
  };

  if (isVerified) {
    return (
      <MarketingLayout>
        <div className="min-h-screen bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border border-gray-200">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Email verified!
                </h2>
                <p className="text-gray-600 mb-6">
                  Your email address has been successfully verified. You can now sign in to your account.
                </p>
                <Button
                  onClick={() => setLocation("/auth/signin")}
                  className="w-full"
                  data-testid="button-signin"
                >
                  Sign in to your account
                </Button>
              </div>
            </div>
          </div>
        </div>
      </MarketingLayout>
    );
  }

  return (
    <MarketingLayout>
      <div className="min-h-screen bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Verify your email
            </h2>
            <p className="text-gray-600">
              We've sent a verification link to your email address. Please check your inbox and click the link to verify your account.
            </p>
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border border-gray-200">
            <div className="mb-6">
              <div className="p-4 rounded-md bg-yellow-50 border border-yellow-200">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-yellow-400 mr-3 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800">
                      Email verification required
                    </h3>
                    <p className="mt-1 text-sm text-yellow-700">
                      You need to verify your email address before you can access your account. 
                      Check your spam folder if you don't see the email.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {success && (
              <div className="mb-4 p-3 rounded-md bg-green-50 border border-green-200">
                <p className="text-sm text-green-800" data-testid="text-success">
                  {success}
                </p>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200">
                <p className="text-sm text-red-800" data-testid="text-error">
                  {error}
                </p>
              </div>
            )}

            <form onSubmit={handleResendVerification} className="space-y-6">
              <div>
                <Label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </Label>
                <div className="mt-1">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter your email"
                    data-testid="input-email"
                  />
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  disabled={resendVerification.isPending}
                  className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
                  data-testid="button-resend"
                >
                  {resendVerification.isPending ? (
                    <>
                      <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                      Sending...
                    </>
                  ) : (
                    "Resend verification email"
                  )}
                </Button>
              </div>

              <div className="text-center space-y-2">
                <p className="text-sm text-gray-500">
                  Already verified your email?
                </p>
                <Button
                  type="button"
                  onClick={() => setLocation("/auth/signin")}
                  variant="outline"
                  className="w-full"
                  data-testid="button-signin"
                >
                  Sign in to your account
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}