import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { User } from "@shared/schema";
import { supabase } from "../supabase";

interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export function useAuth() {
  console.log("useAuth: Hook initialized");
  const queryClient = useQueryClient();
  const [session, setSession] = useState<AuthSession | null>(() => {
    // Load session from localStorage on init
    const savedSession = localStorage.getItem("supabase-session");
    console.log("useAuth: Initial session from localStorage:", savedSession ? "found" : "not found");
    return savedSession ? JSON.parse(savedSession) : null;
  });

  // Save session to localStorage whenever it changes
  useEffect(() => {
    if (session) {
      localStorage.setItem("supabase-session", JSON.stringify(session));
    } else {
      localStorage.removeItem("supabase-session");
    }
  }, [session]);

  // Query to fetch current user data
  const {
    data: user,
    isLoading,
    error,
  } = useQuery<User>({
    queryKey: ["/api/auth/user", session?.access_token],
    queryFn: async () => {
      if (!session?.access_token) {
        throw new Error("No access token");
      }

      // Check if token is expired
      if (
        session.expires_at &&
        session.expires_at < Math.floor(Date.now() / 1000)
      ) {
        // Clear expired session
        setSession(null);
        throw new Error("Token expired");
      }

      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: session.access_token }),
      });

      if (!response.ok) {
        // Clear invalid session
        setSession(null);
        throw new Error("Failed to verify token");
      }

      return response.json();
    },
    enabled: !!session?.access_token,
    retry: false,
  });

  // Listen to Supabase auth state changes (but don't interfere with our custom session management)
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, supabaseSession) => {
      console.log("useAuth: Supabase auth state change:", event, supabaseSession ? "session present" : "no session");
      
      // Only handle Supabase events if we don't have our own session
      // This prevents Supabase from clearing our custom session
      if (event === "SIGNED_OUT" && !session) {
        console.log("useAuth: SIGNED_OUT event, clearing session (only if no custom session)");
        setSession(null);
        queryClient.clear();
      }
      // Don't handle SIGNED_IN or TOKEN_REFRESHED since we manage our own session
    });

    return () => subscription.unsubscribe();
  }, [queryClient, session]);

  // Login mutation
  const login = useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      console.log("useAuth: Login request started:", { email, password });
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      console.log("useAuth: Login response received:", response.status, response.statusText);

      if (!response.ok) {
        const error = await response.json();
        console.error("useAuth: Login failed with error:", error);
        throw new Error(error.message || "Login failed");
      }

      const data = await response.json();
      console.log("useAuth: Login data received:", data);

      // Set session from login response
      if (data.session) {
        console.log("useAuth: Setting session from response");
        setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at || 0,
        });

        // Don't set Supabase session directly since backend uses service role key
        // The frontend will use our custom session management
        console.log("useAuth: Session set successfully (skipping Supabase session)");
      } else {
        console.warn("useAuth: No session in login response");
      }

      return data;
    },
    onSuccess: (data) => {
      console.log("useAuth: Login mutation successful, invalidating queries");
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error) => {
      console.error("useAuth: Login mutation failed:", error);
    },
  });

  // Register mutation
  const register = useMutation({
    mutationFn: async (userData: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      password: string;
    }) => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Registration failed");
      }

      return response.json();
    },
  });

  const logout = async () => {
    console.log("useAuth: Logout function called!");
    try {
      console.log("useAuth: Starting logout process");
      
      // Clear local state first to prevent race conditions
      setSession(null);
      localStorage.removeItem("supabase-session");
      
      // Clear all cached data
      queryClient.clear();
      
      // Call backend logout endpoint if we have a session token
      if (session?.access_token) {
        try {
          console.log("useAuth: Calling backend logout endpoint");
          await fetch("/api/auth/logout", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });
          console.log("useAuth: Backend logout successful");
        } catch (error) {
          console.error("useAuth: Backend logout failed:", error);
        }
      } else {
        console.log("useAuth: No session token, skipping backend logout");
      }
      
      // Sign out from Supabase client - this should clear the Supabase session
      console.log("useAuth: Calling Supabase signOut");
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("useAuth: Supabase logout error:", error);
      } else {
        console.log("useAuth: Supabase logout successful");
      }
      
      // Force a hard redirect to the marketing website
      console.log("useAuth: Redirecting to home page");
      window.location.replace("/");
    } catch (error) {
      console.error("useAuth: Logout failed:", error);
      // Even if logout fails, ensure local state is cleared
      setSession(null);
      localStorage.removeItem("supabase-session");
      queryClient.clear();
      window.location.replace("/");
    }
  };

  // Forgot password mutation
  const forgotPassword = useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Password reset failed");
      }

      return response.json();
    },
  });

  // Reset password mutation
  const resetPassword = useMutation({
    mutationFn: async ({
      token,
      password,
    }: {
      token: string;
      password: string;
    }) => {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Password reset failed");
      }

      return response.json();
    },
  });

  // Resend verification email mutation
  const resendVerification = useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to resend verification email");
      }

      return response.json();
    },
  });

  // Check subscription status mutation
  const isSubscribed = useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      const response = await fetch("/api/auth/has-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to check subscription status");
      }

      const data = await response.json();
      return data; // { isUserSubscribed: boolean }
    },
    onSuccess: (data) => {
      console.log("Subscription check result:", data.isUserSubscribed);
    },
    onError: (error) => {
      console.error("Subscription check failed:", error.message);
    },
  });

  const authState = {
    user,
    session,
    isLoading: (isLoading && !error) || login.isPending || isSubscribed.isPending,
    isAuthenticated: !!user && !!session,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    resendVerification,
    isSubscribed,
    error,
  };

  console.log("useAuth: Returning auth state:", {
    user: user?.id,
    session: session ? "present" : "null",
    isLoading: authState.isLoading,
    isAuthenticated: authState.isAuthenticated,
    error: error?.message
  });

  return authState;
}
