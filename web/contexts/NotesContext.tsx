"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  fetchLatestNotesForUser,
  saveNote,
  type Note,
} from "@/lib/notes-store";
import { useUser } from "@/contexts/UserContext";
import { isTodayLocal } from "@/lib/log-store";

type NotesContextValue = {
  loading: boolean;
  getLatest: (equipmentId: string) => Note | null;
  hasNoteToday: (equipmentId: string) => boolean;
  add: (equipmentId: string, transcript: string) => Promise<Note>;
};

const NotesContext = createContext<NotesContextValue | null>(null);

export function NotesProvider({ children }: { children: ReactNode }) {
  const { currentUser, hydrated: userHydrated } = useUser();
  const [notes, setNotes] = useState<Map<string, Note>>(() => new Map());
  const [loading, setLoading] = useState(true);
  const reqId = useRef(0);

  useEffect(() => {
    if (!userHydrated) return;
    const myReq = ++reqId.current;
    setLoading(true);
    fetchLatestNotesForUser(currentUser.id)
      .then((m) => {
        if (reqId.current === myReq) {
          setNotes(m);
          setLoading(false);
        }
      })
      .catch(() => {
        if (reqId.current === myReq) setLoading(false);
      });
  }, [currentUser.id, userHydrated]);

  const getLatest = useCallback(
    (equipmentId: string): Note | null => {
      return notes.get(equipmentId) ?? null;
    },
    [notes],
  );

  const hasNoteToday = useCallback(
    (equipmentId: string): boolean => {
      const latest = notes.get(equipmentId);
      return !!latest && isTodayLocal(latest.createdAt);
    },
    [notes],
  );

  const add = useCallback(
    async (equipmentId: string, transcript: string): Promise<Note> => {
      const saved = await saveNote(currentUser.id, equipmentId, transcript);
      setNotes((prev) => {
        const next = new Map(prev);
        next.set(equipmentId, saved);
        return next;
      });
      return saved;
    },
    [currentUser.id],
  );

  const value = useMemo(
    () => ({ loading, getLatest, hasNoteToday, add }),
    [loading, getLatest, hasNoteToday, add],
  );

  return (
    <NotesContext.Provider value={value}>{children}</NotesContext.Provider>
  );
}

export function useNotes(): NotesContextValue {
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error("useNotes must be used within <NotesProvider>");
  return ctx;
}
