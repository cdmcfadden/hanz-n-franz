"use client";

import { useEffect, useState } from "react";
import { TellMeModal } from "@/components/TellMeModal";
import { useNotes } from "@/contexts/NotesContext";

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

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polyline points="4 12 10 18 20 6" />
    </svg>
  );
}

export function VoiceNoteButton({
  equipmentId,
  equipmentName,
}: {
  equipmentId: string;
  equipmentName: string;
}) {
  const { hasNoteToday } = useNotes();
  const captured = hasNoteToday(equipmentId);
  const [open, setOpen] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as unknown as Record<string, unknown>;
    setSupported(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  if (!supported) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={`Tell me about ${equipmentName}${captured ? " (captured)" : ""}`}
        className={[
          "w-full aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors ring-1",
          captured
            ? "bg-emerald-700 text-emerald-50 ring-emerald-700 hover:bg-emerald-600"
            : "bg-sky-300 text-sky-950 ring-sky-300 hover:bg-sky-200",
        ].join(" ")}
      >
        {captured ? (
          <CheckIcon className="w-4 h-4" />
        ) : (
          <MicIcon className="w-4 h-4" />
        )}
        <span>Tell Me</span>
      </button>

      {open && (
        <TellMeModal
          equipmentId={equipmentId}
          equipmentName={equipmentName}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
