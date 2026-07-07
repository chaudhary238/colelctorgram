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
  sub_interests?: Record<string, string[]> | null; // per-category chips (DV4-06)
  rating: number;
  rating_count: number;
  followers_count: number;
  following_count: number;
  active_listings_count: number;
  verified_items_count: number;
  email?: string | null;
  privacy_portfolio?: string | null;
  privacy_value?: string | null;
  gender?: string | null; // 'f' | 'm' | 'x'
  birth_year?: number | null;
  feed_prefs?: { categories?: string[]; hide_listings?: boolean } | null;
  // Per-type notification toggles + extra privacy settings (DF-23)
  notif_prefs?: NotifPrefs | null;
  privacy_prefs?: PrivacyPrefs | null;
  email_verified?: boolean | null;
}

export interface NotifPrefs {
  followers: boolean;
  messages: boolean;
  listing_activity: boolean;
  trade_requests: boolean;
  event_reminders: boolean;
  community_activity: boolean;
  price_drops: boolean;
  new_listings: boolean;
}

export interface PrivacyPrefs {
  messaging: "everyone" | "followers" | "none";
  wishlist: "public" | "followers" | "private";
  show_online: boolean;
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
