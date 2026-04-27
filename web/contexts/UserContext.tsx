"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getBrowserSupabase } from "@/lib/supabase-browser";

export type AuthUser = {
  id: string;
  name: string;
  shortName: string;
  avatar: string | null;
  email: string;
};

type Profile = {
  display_name: string;
  short_name: string;
  avatar_url: string | null;
};

type UserContextValue = {
  currentUser: AuthUser | null;
  signOut: () => Promise<void>;
  hydrated: boolean;
};

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const sb = getBrowserSupabase();

    async function loadUser(userId: string, email: string) {
      const { data } = await sb
        .from("profiles")
        .select("display_name, short_name, avatar_url")
        .eq("id", userId)
        .single();
      const profile = data as Profile | null;
      setCurrentUser({
        id: userId,
        name: profile?.display_name ?? email,
        shortName: profile?.short_name ?? email.split("@")[0],
        avatar: profile?.avatar_url ?? null,
        email,
      });
    }

    sb.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUser(session.user.id, session.user.email ?? "").finally(() =>
          setHydrated(true),
        );
      } else {
        setHydrated(true);
      }
    });

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUser(session.user.id, session.user.email ?? "");
      } else {
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    await getBrowserSupabase().auth.signOut();
  }

  return (
    <UserContext.Provider value={{ currentUser, signOut, hydrated }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser must be used within <UserProvider>");
  }
  return ctx;
}
