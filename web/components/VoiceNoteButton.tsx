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

  if (!supported) {
    // Quietly hide on unsupported browsers — the rest of the card still works.
    return null;
  }

  return (
    <div className="mt-1.5 flex items-start gap-2">
      <button
        onClick={phase === "listening" ? stop : start}
        disabled={phase === "saving"}
        className={[
          "shrink-0 inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md transition-colors ring-1",
          phase === "listening"
            ? "bg-[var(--accent)] text-white ring-[var(--accent)] animate-pulse"
            : "bg-black text-neutral-300 ring-[var(--ring)] hover:text-white hover:ring-[var(--ring-strong)]",
          phase === "saving" ? "opacity-60" : "",
        ].join(" ")}
        aria-label={phase === "listening" ? "Stop recording" : "Record a note"}
      >
        <span aria-hidden="true">
          {phase === "listening" ? "■" : phase === "saving" ? "…" : "●"}
        </span>
        {phase === "listening"
          ? "Listening…"
          : phase === "saving"
            ? "Summarizing…"
            : "Speak"}
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
            Tap to record a note about this machine.
          </span>
        )}
      </div>
    </div>
  );
}
