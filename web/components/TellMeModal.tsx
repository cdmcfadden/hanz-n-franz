"use client";

import { useEffect, useRef, useState } from "react";
import { useNotes } from "@/contexts/NotesContext";
import { useEntries } from "@/contexts/EntriesContext";
import { isTodayLocal, todayISO } from "@/lib/log-store";
import type { WeightType } from "@/lib/equipment";

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

type Phase = "ready" | "listening" | "saving" | "review" | "error";

type MoveOption = {
  id: string;
  name: string;
  weight_type?: WeightType;
};

export function TellMeModal({
  equipmentId,
  equipmentName,
  moves,
  onClose,
}: {
  equipmentId: string;
  equipmentName: string;
  moves?: MoveOption[];
  onClose: () => void;
}) {
  const { getLatest, add } = useNotes();
  const { add: addEntry } = useEntries();
  const existing = getLatest(equipmentId);
  const existingIsToday = !!existing && isTodayLocal(existing.createdAt);

  const [phase, setPhase] = useState<Phase>(existingIsToday ? "review" : "ready");
  const [interim, setInterim] = useState("");
  const [savedSummary, setSavedSummary] = useState<string | null>(
    existingIsToday ? existing!.summary : null,
  );
  const [priorSummary] = useState<string | null>(
    !existingIsToday && existing ? existing.summary : null,
  );
  const [extractedWeight, setExtractedWeight] = useState<number | null>(null);
  const [extractedMoveId, setExtractedMoveId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const recognitionRef = useRef<SRInstance | null>(null);
  const finalRef = useRef("");

  // Determine which move to log to: single move → use it; multi-move → match by extracted ID.
  const resolvedMove =
    moves && moves.length === 1
      ? moves[0]
      : moves?.find((m) => m.id === extractedMoveId) ?? null;

  function start() {
    setErr(null);
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setErr("Speech recognition not supported in this browser.");
      setPhase("error");
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
        setPhase("ready");
        return;
      }
      setPhase("saving");
      try {
        const moveInputs = moves?.map((m) => ({ id: m.id, name: m.name }));
        const saved = await add(equipmentId, transcript, moveInputs);
        setSavedSummary(saved.summary);
        setExtractedWeight(saved.extractedWeight ?? null);
        setExtractedMoveId(saved.extractedMoveId ?? null);
        setPhase("review");
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

  async function handleApprove() {
    if (extractedWeight != null && resolvedMove) {
      const weightVal =
        resolvedMove.weight_type === "dumbbell_pair"
          ? extractedWeight * 2
          : extractedWeight;
      try {
        await addEntry(equipmentId, resolvedMove.id, todayISO(), weightVal);
      } catch {
        // Note is already saved; non-fatal if weight log fails.
      }
    }
    onClose();
  }

  useEffect(() => {
    return () => recognitionRef.current?.abort();
  }, []);

  function onBackdrop(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  const willLog = extractedWeight != null && resolvedMove != null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-6"
      onClick={onBackdrop}
    >
      <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-[var(--bg-elev)] ring-1 ring-[var(--ring)] p-5 sm:p-6">
        <header className="mb-4">
          <div className="text-xs uppercase tracking-widest text-neutral-500">
            Tell Me
          </div>
          <h2 className="text-lg font-semibold text-white tracking-tight">
            {equipmentName}
          </h2>
        </header>

        <div className="min-h-[8rem] mb-5">
          {phase === "ready" && !priorSummary && (
            <p className="text-sm text-neutral-400">
              Tap record and describe what you did on this machine.
            </p>
          )}
          {phase === "ready" && priorSummary && (
            <div>
              <div className="text-xs uppercase tracking-widest text-neutral-500 mb-1">
                Last time
              </div>
              <p className="text-sm text-neutral-400">{priorSummary}</p>
              <p className="text-xs text-neutral-500 mt-3">
                Record a fresh note for today.
              </p>
            </div>
          )}
          {phase === "listening" && (
            <div>
              <div className="text-xs uppercase tracking-widest text-sky-300 mb-1">
                Listening…
              </div>
              <p className="text-sm text-neutral-200 italic min-h-[2.5rem]">
                {interim || "…"}
              </p>
            </div>
          )}
          {phase === "saving" && (
            <div>
              <div className="text-xs uppercase tracking-widest text-neutral-500 mb-1">
                Summarizing…
              </div>
              <p className="text-sm text-neutral-400">
                Asking the LLM to boil your note down.
              </p>
            </div>
          )}
          {phase === "review" && savedSummary && (
            <div>
              <div className="text-xs uppercase tracking-widest text-neutral-500 mb-1">
                Summary
              </div>
              <p className="text-sm text-white leading-snug">{savedSummary}</p>
              {willLog && (
                <p className="text-xs text-emerald-400 mt-2">
                  Will log {extractedWeight} lb for {resolvedMove!.name}
                </p>
              )}
            </div>
          )}
          {phase === "error" && (
            <p className="text-sm text-rose-300">{err}</p>
          )}
        </div>

        <footer className="flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="text-sm text-neutral-400 hover:text-white px-3 py-2"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2">
            {phase === "review" && savedSummary && (
              <button
                onClick={start}
                className="text-sm text-neutral-300 hover:text-white px-3 py-2 rounded-lg ring-1 ring-[var(--ring)]"
              >
                Re-record
              </button>
            )}
            {phase === "ready" && (
              <button
                onClick={start}
                className="inline-flex items-center gap-2 bg-sky-300 text-sky-950 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-sky-200"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-sky-950" />
                Record
              </button>
            )}
            {phase === "listening" && (
              <button
                onClick={stop}
                className="inline-flex items-center gap-2 bg-white text-black text-sm font-semibold px-4 py-2 rounded-lg"
              >
                <span className="w-2.5 h-2.5 bg-black rounded-sm" />
                Stop
              </button>
            )}
            {phase === "review" && (
              <button
                onClick={handleApprove}
                className="bg-emerald-500 text-emerald-950 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-emerald-400"
              >
                Approve
              </button>
            )}
            {phase === "error" && (
              <button
                onClick={() => setPhase("ready")}
                className="bg-white text-black text-sm font-semibold px-4 py-2 rounded-lg"
              >
                Try again
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
