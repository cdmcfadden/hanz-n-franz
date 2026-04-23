"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_USER_ID, USERS, type User } from "@/lib/users";

type UserContextValue = {
  currentUser: User;
  setCurrentUserId: (id: string) => void;
  hydrated: boolean;
};

const STORAGE_KEY = "h360:user";

const UserContext = createContext<UserContextValue | null>(null);

function resolveUser(id: string): User {
  return USERS.find((u) => u.id === id) ?? USERS[0];
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUserId, setCurrentUserIdState] =
    useState<string>(DEFAULT_USER_ID);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored && USERS.some((u) => u.id === stored)) {
        setCurrentUserIdState(stored);
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  function setCurrentUserId(id: string) {
    setCurrentUserIdState(id);
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // ignore
    }
  }

  return (
    <UserContext.Provider
      value={{
        currentUser: resolveUser(currentUserId),
        setCurrentUserId,
        hydrated,
      }}
    >
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
