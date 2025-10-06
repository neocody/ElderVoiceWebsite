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
  const queryClient = useQueryClient();
  const [session, setSession] = useState<AuthSession | null>(() => {
    // Load session from localStorage on init
    const savedSession = localStorage.getItem("supabase-session");
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

  // Listen to Supabase auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, supabaseSession) => {
      if (event === "SIGNED_IN" && supabaseSession) {
        setSession({
          access_token: supabaseSession.access_token,
          refresh_token: supabaseSession.refresh_token,
          expires_at: supabaseSession.expires_at || 0,
        });
      } else if (event === "SIGNED_OUT") {
        setSession(null);
        queryClient.clear();
      } else if (event === "TOKEN_REFRESHED" && supabaseSession) {
        setSession({
          access_token: supabaseSession.access_token,
          refresh_token: supabaseSession.refresh_token,
          expires_at: supabaseSession.expires_at || 0,
        });
        // Invalidate user query to refetch with new token
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      }
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  // Login mutation
  const login = useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Login failed");
      }

      const data = await response.json();

      // Set session from login response
      if (data.session) {
        setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at || 0,
        });

        // Also set the session in Supabase client
        await supabase.auth.setSession(data.session);
      }

      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
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
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();

      // Also call backend logout endpoint
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      // Clear local state
      setSession(null);
      localStorage.removeItem("supabase-session");

      // Clear all cached data
      queryClient.clear();

      // Force a hard redirect to the marketing website
      window.location.replace("/");
    } catch (error) {
      console.error("Logout failed:", error);
      // Even if logout fails, clear local state and redirect
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

  return {
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
}
