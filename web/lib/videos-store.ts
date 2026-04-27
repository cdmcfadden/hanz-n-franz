"use client";

import { getBrowserSupabase as getSupabase } from "@/lib/supabase-browser";

export type VideoMeta = {
  id: number;
  equipmentId: string;
  videoPath: string;
  createdAt: string;
};

type Row = {
  id: number;
  user_id: string;
  equipment_id: string;
  video_path: string;
  created_at: string;
};

const BUCKET = "form-videos";

// Returns Set<equipmentId> for which the given user has at least one video.
// Used by the card header to flip the Show Me button green.
export async function fetchVideoEquipmentIds(
  userId: string,
): Promise<Set<string>> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("form_videos")
    .select("equipment_id")
    .eq("user_id", userId);
  if (error) throw error;
  return new Set((data ?? []).map((r: { equipment_id: string }) => r.equipment_id));
}

export async function fetchLatestVideoMap(
  userId: string,
): Promise<Map<string, VideoMeta>> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("form_videos")
    .select("id, user_id, equipment_id, video_path, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const m = new Map<string, VideoMeta>();
  for (const r of (data ?? []) as Row[]) {
    if (!m.has(r.equipment_id)) {
      m.set(r.equipment_id, {
        id: r.id,
        equipmentId: r.equipment_id,
        videoPath: r.video_path,
        createdAt: r.created_at,
      });
    }
  }
  return m;
}

export async function uploadAndRecordVideo(args: {
  userId: string;
  equipmentId: string;
  blob: Blob;
  mimeType?: string;
  durationMs?: number;
}): Promise<VideoMeta> {
  const { userId, equipmentId, blob, mimeType, durationMs } = args;
  const sb = getSupabase();

  const ext =
    (mimeType ?? blob.type ?? "video/webm").includes("mp4")
      ? "mp4"
      : "webm";
  const path = `${userId}/${equipmentId}/${Date.now()}.${ext}`;

  const { error: upErr } = await sb.storage.from(BUCKET).upload(path, blob, {
    contentType: mimeType ?? blob.type ?? "video/webm",
    upsert: false,
  });
  if (upErr) throw upErr;

  const { data, error: insErr } = await sb
    .from("form_videos")
    .insert({
      user_id: userId,
      equipment_id: equipmentId,
      video_path: path,
      mime_type: mimeType ?? blob.type,
      duration_ms: durationMs ?? null,
      size_bytes: blob.size,
    })
    .select("id, equipment_id, video_path, created_at")
    .single();
  if (insErr) throw insErr;

  return {
    id: data.id,
    equipmentId: data.equipment_id,
    videoPath: data.video_path,
    createdAt: data.created_at,
  };
}

export function publicVideoUrl(path: string): string {
  const sb = getSupabase();
  const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
