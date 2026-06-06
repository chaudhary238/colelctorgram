"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

export interface AuthUser {
  id: string;
  handle: string;
  name: string;
  bio: string | null;
  city: string | null;
  avatar_url: string | null;
  tier: string;
  interests: string[];
  deals_count: number;
  rating: number;
  rating_count: number;
  followers_count: number;
  following_count: number;
  active_listings_count: number;
  verified_items_count: number;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  setUser: (u: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  setUser: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem("ch_access_token")) {
      setLoading(false);
      return;
    }
    api
      .get<AuthUser>("/users/me")
      .then(setUser)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useUser() {
  return useContext(AuthContext);
}
