import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "../supabase";
import { Eye, EyeOff, Phone, Shield, Clock, Info } from "lucide-react";
import logoPath from "@assets/elder-voice-logo-white-bkgd-small_1759161354559.png";
import MarketingLayout from "@/components/MarketingLayout";

// BrandPanel Component - Left panel with brand and benefits
function BrandPanel() {
  return (
    <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center relative bg-gradient-to-b from-[#2962EB] to-[#4E48E6] px-12 py-24 min-h-screen">
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Ccircle cx='7' cy='7' r='2'/%3E%3Ccircle cx='53' cy='7' r='2'/%3E%3Ccircle cx='7' cy='53' r='2'/%3E%3Ccircle cx='53' cy='53' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative z-10 max-w-md">
        <div className="mb-8">
          <Link href="/">
            <img
              src={logoPath}
              alt="Elder Voice"
              className="h-12 w-auto mb-6 cursor-pointer transition-all hover:scale-105"
            />
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-white mb-6 leading-tight">
          A calmer way to check in
        </h1>

        <div className="space-y-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <Phone className="w-4 h-4 text-white" />
            </div>
            <div className="text-white">
              <h3 className="font-semibold mb-1">Companionship</h3>
              <p className="text-blue-100 text-sm leading-relaxed">
                Regular, caring AI conversations that brighten their day
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-white" />
            </div>
            <div className="text-white">
              <h3 className="font-semibold mb-1">Simple scheduling</h3>
              <p className="text-blue-100 text-sm leading-relaxed">
                Easy setup with flexible call times that work for them
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div className="text-white">
              <h3 className="font-semibold mb-1">Private & secure</h3>
              <p className="text-blue-100 text-sm leading-relaxed">
                Protected conversations with family insights and peace of mind
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// AuthCard Component - Main authentication form
function AuthCard() {
  const [, setLocation] = useLocation();
  const { login, isLoading, isAuthenticated, isSubscribed, user } = useAuth();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect logic
  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated && user) {
      isSubscribed.mutate({ userId: user.id });
    }
  }, [isAuthenticated, isLoading, user]);

  useEffect(() => {
    if (isSubscribed.isSuccess && isSubscribed.data) {
      if (isSubscribed.data.isUserSubscribed) {
        setLocation("/admin/dashboard");
      } else {
        setLocation("/pricing");
      }
    }
  }, [isSubscribed.isSuccess, isSubscribed.data, setLocation]);

  const validateForm = () => {
    const errors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!password.trim()) {
      errors.password = "Password is required";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await login.mutateAsync({ email, password });
    } catch (err: any) {
      if (
        err.message?.includes("401") ||
        err.message?.toLowerCase().includes("invalid")
      ) {
        setError("Incorrect email or password. Please try again.");
      } else if (
        err.message?.toLowerCase().includes("rate") ||
        err.message?.toLowerCase().includes("limit")
      ) {
        setError(
          "Too many sign-in attempts. Please wait a few minutes before trying again.",
        );
      } else {
        setError(err.message || "Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/admin/dashboard`,
        },
      });

      if (error) {
        setError("Google sign-in failed. Please try again.");
      }
    } catch (err: any) {
      setError("Google sign-in failed. Please try again.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit(e as any);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-20 xl:px-24 bg-gray-50 min-h-screen">
      <div className="mx-auto w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg px-6 py-8 sm:px-8">
          {/* Error Banner */}
          {error && (
            <div
              className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200"
              role="alert"
              aria-live="polite"
            >
              <p className="text-sm text-red-800 font-medium">{error}</p>
            </div>
          )}

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Sign in to your account
            </h1>
            <p className="text-gray-600">
              Welcome back! Please enter your details.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) {
                    setFieldErrors((prev) => ({ ...prev, email: undefined }));
                  }
                }}
                onKeyDown={handleKeyDown}
                className={`block w-full px-3 py-3 text-base border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2962EB] focus:border-[#2962EB] transition-colors ${
                  fieldErrors.email
                    ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300"
                }`}
                placeholder="Enter your email"
                aria-invalid={fieldErrors.email ? "true" : "false"}
                aria-describedby={fieldErrors.email ? "email-error" : undefined}
                data-testid="input-email"
              />
              {fieldErrors.email && (
                <p
                  id="email-error"
                  className="mt-2 text-sm text-red-600"
                  role="alert"
                >
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        password: undefined,
                      }));
                    }
                  }}
                  onKeyDown={handleKeyDown}
                  className={`block w-full px-3 py-3 pr-10 text-base border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2962EB] focus:border-[#2962EB] transition-colors ${
                    fieldErrors.password
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder="Enter your password"
                  aria-invalid={fieldErrors.password ? "true" : "false"}
                  aria-describedby={
                    fieldErrors.password
                      ? "password-error password-help"
                      : "password-help"
                  }
                  data-testid="input-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  data-testid="button-toggle-password"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p
                  id="password-error"
                  className="mt-2 text-sm text-red-600"
                  role="alert"
                >
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-[#2962EB] focus:ring-[#2962EB] border-gray-300 rounded"
                  data-testid="checkbox-remember-me"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Remember me
                </label>
              </div>

              <Link href="/auth/forgot-password">
                <span className="text-sm font-medium text-[#2962EB] hover:text-[#4E48E6] cursor-pointer transition-colors">
                  Forgot your password?
                </span>
              </Link>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-[#2962EB] hover:bg-[#1e4ba8] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2962EB] disabled:opacity-50 disabled:cursor-not-allowed transition-all min-h-[44px]"
              aria-describedby={isSubmitting ? "sign-in-status" : undefined}
              data-testid="button-sign-in"
            >
              {isSubmitting || isLoading ? (
                <div className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span id="sign-in-status">Signing you in...</span>
                </div>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  or continue with
                </span>
              </div>
            </div>
          </div>

          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            className="mt-6 w-full inline-flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2962EB] transition-all min-h-[44px]"
            data-testid="button-google-signin"
          >
            <svg
              className="w-5 h-5 mr-3"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </button>

          {/* Sign Up Link */}
          <p className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link href="/getstarted">
              <span className="font-medium text-[#2962EB] hover:text-[#4E48E6] cursor-pointer transition-colors">
                Sign up
              </span>
            </Link>
          </p>
        </div>

        {/* Footer Links - Below auth card */}
        <div className="mt-8 flex justify-center items-center space-x-6">
          <Link href="/privacy-policy">
            <span className="text-xs text-gray-500 hover:text-gray-700 cursor-pointer transition-colors">
              Privacy
            </span>
          </Link>
          <Link href="/terms-of-service">
            <span className="text-xs text-gray-500 hover:text-gray-700 cursor-pointer transition-colors">
              Terms
            </span>
          </Link>
          <Link href="/contact">
            <span className="text-xs text-gray-500 hover:text-gray-700 cursor-pointer transition-colors">
              Support
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Main SignIn Component
export default function SignIn() {
  return (
    <MarketingLayout>
      <div className="min-h-screen flex">
        <BrandPanel />
        <AuthCard />
      </div>
    </MarketingLayout>
  );
}
