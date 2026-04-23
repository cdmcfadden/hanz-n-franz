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
  addEntry as dbAdd,
  fetchEntriesForUser,
  keys,
  removeEntry as dbRemove,
  deleteAllEntries as dbDeleteAll,
  type EntryMap,
  type LogEntry,
} from "@/lib/log-store";
import { useUser } from "@/contexts/UserContext";

type EntriesContextValue = {
  loading: boolean;
  error: string | null;
  getEntries: (equipmentId: string, moveId: string) => LogEntry[];
  add: (
    equipmentId: string,
    moveId: string,
    date: string,
    weight: number,
  ) => Promise<void>;
  remove: (
    equipmentId: string,
    moveId: string,
    entryId: number,
  ) => Promise<void>;
  deleteAll: () => Promise<void>;
};

const EntriesContext = createContext<EntriesContextValue | null>(null);

export function EntriesProvider({ children }: { children: ReactNode }) {
  const { currentUser, hydrated: userHydrated } = useUser();
  const [entries, setEntries] = useState<EntryMap>(() => new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reqId = useRef(0);

  useEffect(() => {
    if (!userHydrated) return;
    const myReq = ++reqId.current;
    setLoading(true);
    setError(null);
    fetchEntriesForUser(currentUser.id)
      .then((m) => {
        if (reqId.current === myReq) {
          setEntries(m);
          setLoading(false);
        }
      })
      .catch((e: unknown) => {
        if (reqId.current === myReq) {
          setError(e instanceof Error ? e.message : String(e));
          setLoading(false);
        }
      });
  }, [currentUser.id, userHydrated]);

  const getEntries = useCallback(
    (equipmentId: string, moveId: string): LogEntry[] => {
      return entries.get(keys.moveKey(equipmentId, moveId)) ?? [];
    },
    [entries],
  );

  const add = useCallback(
    async (
      equipmentId: string,
      moveId: string,
      date: string,
      weight: number,
    ) => {
      const created = await dbAdd(
        currentUser.id,
        equipmentId,
        moveId,
        date,
        weight,
      );
      setEntries((prev) => {
        const next = new Map(prev);
        const k = keys.moveKey(equipmentId, moveId);
        const list = [...(next.get(k) ?? []), created].sort((a, b) =>
          a.date.localeCompare(b.date),
        );
        next.set(k, list);
        return next;
      });
    },
    [currentUser.id],
  );

  const remove = useCallback(
    async (equipmentId: string, moveId: string, entryId: number) => {
      await dbRemove(entryId);
      setEntries((prev) => {
        const next = new Map(prev);
        const k = keys.moveKey(equipmentId, moveId);
        const list = (next.get(k) ?? []).filter((e) => e.id !== entryId);
        next.set(k, list);
        return next;
      });
    },
    [],
  );

  const deleteAll = useCallback(async () => {
    await dbDeleteAll();
    setEntries(new Map());
  }, []);

  const value = useMemo(
    () => ({ loading, error, getEntries, add, remove, deleteAll }),
    [loading, error, getEntries, add, remove, deleteAll],
  );

  return (
    <EntriesContext.Provider value={value}>{children}</EntriesContext.Provider>
  );
}

export function useEntries(): EntriesContextValue {
  const ctx = useContext(EntriesContext);
  if (!ctx) throw new Error("useEntries must be used within <EntriesProvider>");
  return ctx;
}
