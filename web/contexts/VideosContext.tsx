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
  fetchLatestVideoMap,
  uploadAndRecordVideo,
  type VideoMeta,
} from "@/lib/videos-store";
import { useUser } from "@/contexts/UserContext";
import { isTodayLocal } from "@/lib/log-store";

type VideosContextValue = {
  loading: boolean;
  hasVideoToday: (equipmentId: string) => boolean;
  getLatest: (equipmentId: string) => VideoMeta | null;
  saveVideo: (args: {
    equipmentId: string;
    blob: Blob;
    mimeType?: string;
    durationMs?: number;
  }) => Promise<VideoMeta>;
};

const VideosContext = createContext<VideosContextValue | null>(null);

export function VideosProvider({ children }: { children: ReactNode }) {
  const { currentUser, hydrated: userHydrated } = useUser();
  const [latest, setLatest] = useState<Map<string, VideoMeta>>(() => new Map());
  const [loading, setLoading] = useState(true);
  const reqId = useRef(0);

  useEffect(() => {
    if (!userHydrated || !currentUser) return;
    const myReq = ++reqId.current;
    setLoading(true);
    fetchLatestVideoMap(currentUser.id)
      .then((m) => {
        if (reqId.current === myReq) {
          setLatest(m);
          setLoading(false);
        }
      })
      .catch(() => {
        if (reqId.current === myReq) setLoading(false);
      });
  }, [currentUser?.id, userHydrated]);

  const getLatest = useCallback(
    (equipmentId: string): VideoMeta | null =>
      latest.get(equipmentId) ?? null,
    [latest],
  );

  const hasVideoToday = useCallback(
    (equipmentId: string): boolean => {
      const v = latest.get(equipmentId);
      return !!v && isTodayLocal(v.createdAt);
    },
    [latest],
  );

  const saveVideo = useCallback(
    async (args: {
      equipmentId: string;
      blob: Blob;
      mimeType?: string;
      durationMs?: number;
    }) => {
      if (!currentUser) throw new Error("Not authenticated");
      const saved = await uploadAndRecordVideo({
        userId: currentUser.id,
        ...args,
      });
      setLatest((prev) => {
        const next = new Map(prev);
        next.set(args.equipmentId, saved);
        return next;
      });
      return saved;
    },
    [currentUser],
  );

  const value = useMemo(
    () => ({ loading, hasVideoToday, getLatest, saveVideo }),
    [loading, hasVideoToday, getLatest, saveVideo],
  );

  return (
    <VideosContext.Provider value={value}>{children}</VideosContext.Provider>
  );
}

export function useVideos(): VideosContextValue {
  const ctx = useContext(VideosContext);
  if (!ctx) throw new Error("useVideos must be used within <VideosProvider>");
  return ctx;
}
