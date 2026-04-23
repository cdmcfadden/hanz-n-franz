"use client";

import { useEffect, useRef, useState } from "react";
import { useVideos } from "@/contexts/VideosContext";

function CameraIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M23 7l-7 5 7 5V7z" />
      <rect x="1" y="5" width="15" height="14" rx="2" />
    </svg>
  );
}

type Phase = "idle" | "opening" | "live" | "recording" | "review" | "saving" | "error";

export function FormVideoButton({
  equipmentId,
  equipmentName,
}: {
  equipmentId: string;
  equipmentName: string;
}) {
  const { hasVideo, saveVideo } = useVideos();
  const captured = hasVideo(equipmentId);

  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [err, setErr] = useState<string | null>(null);
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [supported, setSupported] = useState(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeRef = useRef<string>("video/webm");
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const elapsedTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    setSupported(
      !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined",
    );
  }, []);

  function cleanupStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }
  function cleanupAll() {
    cleanupStream();
    if (elapsedTimerRef.current !== null) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
    if (playbackUrl) URL.revokeObjectURL(playbackUrl);
    setPlaybackUrl(null);
    setRecordedBlob(null);
    setElapsed(0);
    chunksRef.current = [];
  }

  async function openCamera(desired: "environment" | "user" = facing) {
    setOpen(true);
    setErr(null);
    setPhase("opening");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: desired },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        await videoRef.current.play().catch(() => {});
      }
      setPhase("live");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "camera error");
      setPhase("error");
    }
  }

  async function flipCamera() {
    const next = facing === "environment" ? "user" : "environment";
    setFacing(next);
    cleanupStream();
    await openCamera(next);
  }

  function startRecording() {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const mimeCandidates = ["video/webm;codecs=vp9", "video/webm", "video/mp4"];
    const mime = mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m));
    const rec = mime
      ? new MediaRecorder(streamRef.current, { mimeType: mime })
      : new MediaRecorder(streamRef.current);
    mimeRef.current = rec.mimeType || mime || "video/webm";
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeRef.current });
      const url = URL.createObjectURL(blob);
      setPlaybackUrl(url);
      setRecordedBlob(blob);
      cleanupStream();
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.src = url;
        videoRef.current.muted = true;
        videoRef.current.controls = true;
        videoRef.current.loop = true;
        videoRef.current.play().catch(() => {});
      }
      setPhase("review");
      if (elapsedTimerRef.current !== null) {
        clearInterval(elapsedTimerRef.current);
        elapsedTimerRef.current = null;
      }
    };
    recorderRef.current = rec;
    rec.start();
    setElapsed(0);
    const started = Date.now();
    elapsedTimerRef.current = window.setInterval(() => {
      const secs = Math.floor((Date.now() - started) / 1000);
      setElapsed(secs);
      if (secs >= 60) stopRecording();
    }, 250);
    setPhase("recording");
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }

  async function saveClip() {
    if (!recordedBlob) return;
    setErr(null);
    setPhase("saving");
    try {
      await saveVideo({
        equipmentId,
        blob: recordedBlob,
        mimeType: mimeRef.current,
        durationMs: elapsed * 1000,
      });
      cleanupAll();
      setOpen(false);
      setPhase("idle");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "upload failed");
      setPhase("error");
    }
  }

  function close() {
    try {
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    } catch {
      /* ignore */
    }
    cleanupAll();
    setOpen(false);
    setPhase("idle");
    setErr(null);
  }

  function rerecord() {
    if (playbackUrl) URL.revokeObjectURL(playbackUrl);
    setPlaybackUrl(null);
    setRecordedBlob(null);
    setPhase("idle");
    void openCamera();
  }

  useEffect(() => {
    return () => cleanupAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!supported) return null;

  return (
    <>
      <button
        onClick={() => openCamera()}
        aria-label={`Show me my form on ${equipmentName}`}
        className={[
          "w-full aspect-square rounded-xl flex flex-col items-center justify-center gap-1.5 text-xs font-semibold transition-colors ring-1",
          captured
            ? "bg-emerald-500 text-emerald-950 ring-emerald-500 hover:bg-emerald-400"
            : "bg-sky-300 text-sky-950 ring-sky-300 hover:bg-sky-200",
        ].join(" ")}
      >
        <CameraIcon className="w-6 h-6" />
        <span>Show Me</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <header className="flex items-center justify-between gap-3 px-4 py-3 ring-1 ring-[var(--ring)]">
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-widest text-neutral-400">
                Show Me
              </div>
              <div className="text-sm font-medium text-white truncate">
                {equipmentName}
              </div>
            </div>
            <button
              onClick={close}
              className="text-sm text-neutral-300 hover:text-white px-2 py-1"
              aria-label="Close"
            >
              Close
            </button>
          </header>

          <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="max-w-full max-h-full w-full h-full object-contain"
            />

            {phase === "recording" && (
              <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 text-xs text-white">
                <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
                REC {String(Math.floor(elapsed / 60)).padStart(2, "0")}:
                {String(elapsed % 60).padStart(2, "0")}
              </div>
            )}

            {phase === "opening" && (
              <p className="absolute text-neutral-500 text-sm">Opening camera…</p>
            )}
            {phase === "saving" && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                <p className="text-white text-sm">Uploading…</p>
              </div>
            )}
          </div>

          <footer className="px-4 py-4 flex items-center justify-between gap-3 ring-1 ring-[var(--ring)]">
            {phase === "live" && (
              <>
                <button
                  onClick={flipCamera}
                  className="text-xs text-neutral-300 hover:text-white px-3 py-2"
                >
                  Flip camera
                </button>
                <button
                  onClick={startRecording}
                  className="inline-flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white text-sm font-semibold px-4 py-2.5 rounded-lg"
                >
                  <span className="w-3 h-3 rounded-full bg-white" />
                  Record
                </button>
                <span className="w-24" />
              </>
            )}
            {phase === "recording" && (
              <button
                onClick={stopRecording}
                className="mx-auto inline-flex items-center gap-2 bg-white text-black text-sm font-semibold px-4 py-2.5 rounded-lg"
              >
                <span className="w-3 h-3 bg-black rounded-sm" />
                Stop
              </button>
            )}
            {phase === "review" && (
              <>
                <button
                  onClick={rerecord}
                  className="text-xs text-neutral-300 hover:text-white px-3 py-2"
                >
                  Re-record
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={close}
                    className="text-sm text-neutral-300 hover:text-white px-3 py-2"
                  >
                    Discard
                  </button>
                  <button
                    onClick={saveClip}
                    className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 text-sm font-semibold px-4 py-2.5 rounded-lg"
                  >
                    Save
                  </button>
                </div>
              </>
            )}
            {phase === "saving" && (
              <div className="mx-auto text-xs text-neutral-400">Uploading…</div>
            )}
            {phase === "opening" && (
              <div className="mx-auto text-xs text-neutral-500">
                Waiting for camera permission…
              </div>
            )}
            {phase === "error" && (
              <div className="mx-auto text-xs text-rose-300">
                {err ?? "camera error"}
              </div>
            )}
          </footer>
        </div>
      )}
    </>
  );
}
