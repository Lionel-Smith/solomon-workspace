"use client";

/**
 * AuthContext — lightweight auth state for the client.
 *
 * The JWT lives in an httpOnly cookie (set by the cloud server).
 * This context only tracks the user identity returned from /auth/me
 * and provides a logout action that clears the cookie server-side.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { config } from "@/lib/config";

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Try to fetch current user on mount (cookie sent automatically).
    fetch(`${config.apiBaseUrl}/auth/me`, { credentials: "include" })
      .then(async (res) => {
        if (res.ok) {
          const data = (await res.json()) as User;
          setUser(data);
        }
      })
      .catch(() => {
        // not authenticated — user stays null
      })
      .finally(() => setIsLoading(false));
  }, []);

  const logout = useCallback(async () => {
    await fetch(`${config.apiBaseUrl}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
