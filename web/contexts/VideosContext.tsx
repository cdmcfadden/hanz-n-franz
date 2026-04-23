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
  fetchVideoEquipmentIds,
  uploadAndRecordVideo,
  type VideoMeta,
} from "@/lib/videos-store";
import { useUser } from "@/contexts/UserContext";

type VideosContextValue = {
  loading: boolean;
  hasVideo: (equipmentId: string) => boolean;
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
  const [ids, setIds] = useState<Set<string>>(() => new Set());
  const [loading, setLoading] = useState(true);
  const reqId = useRef(0);

  useEffect(() => {
    if (!userHydrated) return;
    const myReq = ++reqId.current;
    setLoading(true);
    fetchVideoEquipmentIds(currentUser.id)
      .then((s) => {
        if (reqId.current === myReq) {
          setIds(s);
          setLoading(false);
        }
      })
      .catch(() => {
        if (reqId.current === myReq) setLoading(false);
      });
  }, [currentUser.id, userHydrated]);

  const hasVideo = useCallback(
    (equipmentId: string) => ids.has(equipmentId),
    [ids],
  );

  const saveVideo = useCallback(
    async (args: {
      equipmentId: string;
      blob: Blob;
      mimeType?: string;
      durationMs?: number;
    }) => {
      const saved = await uploadAndRecordVideo({
        userId: currentUser.id,
        ...args,
      });
      setIds((prev) => {
        const next = new Set(prev);
        next.add(args.equipmentId);
        return next;
      });
      return saved;
    },
    [currentUser.id],
  );

  const value = useMemo(
    () => ({ loading, hasVideo, saveVideo }),
    [loading, hasVideo, saveVideo],
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
