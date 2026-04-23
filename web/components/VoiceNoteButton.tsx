"use client";

import { useEffect, useRef, useState } from "react";
import { useNotes } from "@/contexts/NotesContext";

// Minimal, browser-typed SpeechRecognition shape. Real definitions live on
// window.SpeechRecognition (or the webkit-prefixed variant on Safari).
type SRResult = { transcript: string };
type SREvent = {
  resultIndex: number;
  results: { isFinal: boolean; 0: SRResult }[];
};
type SRInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SREvent) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
};
type SRCtor = new () => SRInstance;

function getRecognitionCtor(): SRCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SRCtor;
    webkitSpeechRecognition?: SRCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

type Phase = "idle" | "listening" | "saving" | "error";

function MicIcon({ className = "" }: { className?: string }) {
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
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 11v1a7 7 0 0 0 14 0v-1" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
}

function StopSquare({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      fill="currentColor"
    >
      <rect x="6" y="6" width="12" height="12" rx="1" />
    </svg>
  );
}

export function VoiceNoteButton({ equipmentId }: { equipmentId: string }) {
  const { getLatest, add } = useNotes();
  const latest = getLatest(equipmentId);

  const [phase, setPhase] = useState<Phase>("idle");
  const [interim, setInterim] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);
  const [supported, setSupported] = useState<boolean>(true);
  const recognitionRef = useRef<SRInstance | null>(null);
  const finalRef = useRef<string>("");

  useEffect(() => {
    setSupported(!!getRecognitionCtor());
  }, []);

  function start() {
    setErr(null);
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setSupported(false);
      return;
    }
    finalRef.current = "";
    setInterim("");
    const r = new Ctor();
    r.lang = "en-US";
    r.continuous = false;
    r.interimResults = true;
    r.onresult = (e) => {
      let final = "";
      let running = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) final += res[0].transcript;
        else running += res[0].transcript;
      }
      if (final) finalRef.current += final;
      setInterim(running);
    };
    r.onerror = (e) => {
      setErr(e?.error ?? "recognition error");
      setPhase("error");
    };
    r.onend = async () => {
      const transcript = (finalRef.current || interim).trim();
      recognitionRef.current = null;
      if (!transcript) {
        setPhase("idle");
        return;
      }
      setPhase("saving");
      try {
        await add(equipmentId, transcript);
        setPhase("idle");
      } catch (e) {
        setErr(e instanceof Error ? e.message : "save failed");
        setPhase("error");
      } finally {
        setInterim("");
        finalRef.current = "";
      }
    };
    recognitionRef.current = r;
    try {
      r.start();
      setPhase("listening");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "start failed");
      setPhase("error");
    }
  }

  function stop() {
    recognitionRef.current?.stop();
  }

  useEffect(() => {
    return () => recognitionRef.current?.abort();
  }, []);

  if (!supported) return null;

  return (
    <div className="mt-1.5 flex items-start gap-2">
      <button
        onClick={phase === "listening" ? stop : start}
        disabled={phase === "saving"}
        className={[
          "shrink-0 inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md transition-colors ring-1",
          phase === "listening"
            ? "bg-sky-400 text-sky-950 ring-sky-400 animate-pulse"
            : "bg-sky-300 text-sky-950 ring-sky-300 hover:bg-sky-200 hover:ring-sky-200",
          phase === "saving" ? "opacity-60" : "",
        ].join(" ")}
        aria-label={phase === "listening" ? "Stop recording" : "Record a note"}
      >
        {phase === "listening" ? (
          <StopSquare className="w-3.5 h-3.5" />
        ) : phase === "saving" ? (
          <span aria-hidden="true">…</span>
        ) : (
          <MicIcon className="w-3.5 h-3.5" />
        )}
        {phase === "listening"
          ? "Listening…"
          : phase === "saving"
            ? "Summarizing…"
            : "Tell Me"}
      </button>

      <div className="min-w-0 flex-1 text-[12px] leading-snug">
        {phase === "listening" && interim && (
          <span className="text-neutral-400 italic">{interim}</span>
        )}
        {phase !== "listening" && err && (
          <span className="text-rose-300">{err}</span>
        )}
        {phase !== "listening" && !err && latest && (
          <span className="text-neutral-300">{latest.summary}</span>
        )}
        {phase !== "listening" && !err && !latest && (
          <span className="text-neutral-600 italic">
            tap to record a note about your workout
          </span>
        )}
      </div>
    </div>
  );
}
