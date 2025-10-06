import { useState } from "react";
import { useLocation } from "wouter";
import MarketingLayout from "@/components/MarketingLayout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail } from "lucide-react";

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const { forgotPassword } = useAuth();
  
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    try {
      await forgotPassword.mutateAsync(email);
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
    }
  };

  if (isSubmitted) {
    return (
      <MarketingLayout>
        <div className="min-h-screen bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border border-gray-200">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <Mail className="h-6 w-6 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Check your email
                </h2>
                <p className="text-gray-600 mb-6">
                  If an account with <strong>{email}</strong> exists, we've sent you a password reset link.
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  Don't see the email? Check your spam folder or try again with a different email address.
                </p>
                <div className="space-y-3">
                  <Button
                    onClick={() => setIsSubmitted(false)}
                    variant="outline"
                    className="w-full"
                    data-testid="button-try-again"
                  >
                    Try another email
                  </Button>
                  <Button
                    onClick={() => setLocation("/auth/signin")}
                    className="w-full"
                    data-testid="button-back-signin"
                  >
                    Back to sign in
                  </Button>
                </div>
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
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Forgot your password?
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border border-gray-200">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 rounded-md bg-red-50 border border-red-200">
                  <p className="text-sm text-red-800" data-testid="text-error">
                    {error}
                  </p>
                </div>
              )}

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
                  disabled={forgotPassword.isPending}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
                  data-testid="button-submit"
                >
                  {forgotPassword.isPending ? "Sending..." : "Send reset link"}
                </Button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setLocation("/auth/signin")}
                  className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
                  data-testid="link-back-signin"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to sign in
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}