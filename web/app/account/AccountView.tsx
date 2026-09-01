"use client";

import { useCallback, useEffect, useState } from "react";
import { useUser } from "@/contexts/UserContext";

type Member = {
  id: string;
  display_name: string;
  short_name: string;
  avatar_url: string | null;
};

type AthleteEvent = {
  id: number;
  title: string;
  event_date: string;
  notes: string | null;
};

export function AccountView() {
  const { currentUser, refreshUser, hydrated } = useUser();
  const [inviteUrl, setInviteUrl] = useState("");
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [shortName, setShortName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");

  const [memorySummary, setMemorySummary] = useState("");
  const [memorySaving, setMemorySaving] = useState(false);
  const [memorySaveStatus, setMemorySaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [learning, setLearning] = useState(false);
  const [learnError, setLearnError] = useState<string | null>(null);

  const [events, setEvents] = useState<AthleteEvent[]>([]);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventNotes, setNewEventNotes] = useState("");
  const [addingEvent, setAddingEvent] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setInviteUrl(`${window.location.origin}/buddy/join/${currentUser.id}`);
      setDisplayName(currentUser.name);
      setShortName(currentUser.shortName);
    }
  }, [currentUser?.id, currentUser?.name, currentUser?.shortName]);

  useEffect(() => {
    if (!inviteUrl) return;
    import("qrcode").then((mod) => {
      mod.default
        .toString(inviteUrl, {
          type: "svg",
          margin: 1,
          width: 200,
          color: { dark: "#000000", light: "#ffffff" },
        })
        .then(setQrSvg);
    });
  }, [inviteUrl]);

  const fetchMembers = useCallback(async () => {
    const res = await fetch("/api/buddy/members");
    if (!res.ok) return;
    const data = await res.json();
    setMembers(data.members ?? []);
    setGroupId(data.groupId ?? null);
  }, []);

  useEffect(() => {
    if (hydrated && currentUser) fetchMembers();
  }, [hydrated, currentUser, fetchMembers]);

  const fetchMemory = useCallback(async () => {
    const res = await fetch("/api/memory");
    if (!res.ok) return;
    const data = await res.json();
    setMemorySummary(data.summary ?? "");
    setEvents(data.events ?? []);
  }, []);

  useEffect(() => {
    if (hydrated && currentUser) fetchMemory();
  }, [hydrated, currentUser, fetchMemory]);

  async function handleSaveMemory() {
    setMemorySaving(true);
    setMemorySaveStatus("idle");
    try {
      const res = await fetch("/api/memory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary: memorySummary }),
      });
      if (!res.ok) throw new Error();
      setMemorySaveStatus("saved");
      setTimeout(() => setMemorySaveStatus("idle"), 2500);
    } catch {
      setMemorySaveStatus("error");
    } finally {
      setMemorySaving(false);
    }
  }

  async function handleLearn() {
    setLearning(true);
    setLearnError(null);
    try {
      const res = await fetch("/api/memory/learn", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update memory");
      setMemorySummary(data.summary ?? "");
    } catch (e) {
      setLearnError(e instanceof Error ? e.message : "Failed to update memory");
    } finally {
      setLearning(false);
    }
  }

  async function handleAddEvent() {
    if (!newEventTitle.trim() || !newEventDate) return;
    setAddingEvent(true);
    try {
      const res = await fetch("/api/memory/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newEventTitle.trim(),
          event_date: newEventDate,
          notes: newEventNotes.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setEvents((prev) =>
        [...prev, created].sort((a, b) => a.event_date.localeCompare(b.event_date)),
      );
      setNewEventTitle("");
      setNewEventDate("");
      setNewEventNotes("");
    } finally {
      setAddingEvent(false);
    }
  }

  async function handleDeleteEvent(id: number) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    await fetch(`/api/memory/events?id=${id}`, { method: "DELETE" });
  }

  async function handleLeave() {
    setLeaving(true);
    try {
      await fetch("/api/buddy/leave", { method: "POST" });
      setGroupId(null);
      await fetchMembers();
    } finally {
      setLeaving(false);
    }
  }

  async function handleSaveName() {
    setSaving(true);
    setSaveStatus("idle");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: displayName, short_name: shortName }),
      });
      if (!res.ok) throw new Error();
      await refreshUser();
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!hydrated) return null;

  const buddies = members.filter((m) => m.id !== currentUser?.id);

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">
          Display Name
        </h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Full name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-xl bg-neutral-900 ring-1 ring-[var(--ring)] px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:ring-[var(--accent)]"
              placeholder="Full display name"
              maxLength={80}
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Short name</label>
            <input
              type="text"
              value={shortName}
              onChange={(e) => setShortName(e.target.value)}
              className="w-full rounded-xl bg-neutral-900 ring-1 ring-[var(--ring)] px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:ring-[var(--accent)]"
              placeholder="Short name (used in headings)"
              maxLength={30}
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveName}
              disabled={saving || !displayName.trim() || !shortName.trim()}
              className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40 transition-opacity"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            {saveStatus === "saved" && (
              <span className="text-xs text-green-400">Saved</span>
            )}
            {saveStatus === "error" && (
              <span className="text-xs text-[var(--accent)]">Failed to save</span>
            )}
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">
          Goals &amp; Preferences
        </h2>
        <p className="text-sm text-neutral-500 mb-3">
          What the AI remembers about your goals, preferences, and habits. It factors this into
          every generated workout. Edit it directly, or let it learn from your recent logs and
          notes.
        </p>
        <textarea
          value={memorySummary}
          onChange={(e) => setMemorySummary(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="e.g. Prefers free weights over machines, training for hypertrophy, tends to skip leg day..."
          className="w-full rounded-xl bg-neutral-900 ring-1 ring-[var(--ring)] px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:ring-[var(--accent)] resize-none"
        />
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <button
            onClick={handleSaveMemory}
            disabled={memorySaving}
            className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40 transition-opacity"
          >
            {memorySaving ? "Saving…" : "Save"}
          </button>
          <button
            onClick={handleLearn}
            disabled={learning}
            className="rounded-xl ring-1 ring-[var(--ring)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40 transition-opacity"
          >
            {learning ? "Thinking…" : "Refresh from recent activity"}
          </button>
          {memorySaveStatus === "saved" && <span className="text-xs text-green-400">Saved</span>}
          {memorySaveStatus === "error" && (
            <span className="text-xs text-[var(--accent)]">Failed to save</span>
          )}
          {learnError && <span className="text-xs text-[var(--accent)]">{learnError}</span>}
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">
          Upcoming Events
        </h2>
        <p className="text-sm text-neutral-500 mb-3">
          Races, deadlines, or anything else that should shape your training (e.g. a marathon
          date). Workouts adjust as the date approaches.
        </p>
        {events.length > 0 && (
          <div className="space-y-2 mb-4">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-neutral-900 ring-1 ring-[var(--ring)] px-4 py-3"
              >
                <div>
                  <div className="text-sm font-medium text-white">{ev.title}</div>
                  <div className="text-xs text-neutral-500">
                    {ev.event_date}
                    {ev.notes ? ` — ${ev.notes}` : ""}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteEvent(ev.id)}
                  className="text-xs text-neutral-500 hover:text-[var(--accent)] transition-colors shrink-0"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="space-y-3">
          <div className="flex gap-3">
            <input
              type="text"
              value={newEventTitle}
              onChange={(e) => setNewEventTitle(e.target.value)}
              placeholder="e.g. Chicago Marathon"
              maxLength={120}
              className="flex-1 rounded-xl bg-neutral-900 ring-1 ring-[var(--ring)] px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:ring-[var(--accent)]"
            />
            <input
              type="date"
              value={newEventDate}
              onChange={(e) => setNewEventDate(e.target.value)}
              className="rounded-xl bg-neutral-900 ring-1 ring-[var(--ring)] px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-[var(--accent)]"
            />
          </div>
          <input
            type="text"
            value={newEventNotes}
            onChange={(e) => setNewEventNotes(e.target.value)}
            placeholder="Optional notes (e.g. goal time, taper plan)"
            maxLength={500}
            className="w-full rounded-xl bg-neutral-900 ring-1 ring-[var(--ring)] px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:ring-[var(--accent)]"
          />
          <button
            onClick={handleAddEvent}
            disabled={addingEvent || !newEventTitle.trim() || !newEventDate}
            className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40 transition-opacity"
          >
            {addingEvent ? "Adding…" : "Add event"}
          </button>
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">
          Your Buddy Link
        </h2>
        <p className="text-sm text-neutral-500 mb-4">
          Show this QR code or share the link so someone can join your buddy group.
        </p>
        {qrSvg ? (
          <div
            className="w-48 h-48 rounded-2xl overflow-hidden bg-white p-2"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
        ) : (
          <div className="w-48 h-48 rounded-2xl bg-neutral-900 animate-pulse ring-1 ring-[var(--ring)]" />
        )}
        <button
          onClick={handleCopy}
          className="mt-3 text-xs text-neutral-500 hover:text-white transition-colors"
        >
          {copied ? "Copied!" : "Copy link"}
        </button>
      </section>

      <section>
        <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">
          Buddy Group
        </h2>
        {buddies.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No buddies yet. Share your QR code or link to pair up (max 4 per group).
          </p>
        ) : (
          <div className="space-y-2">
            {buddies.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 rounded-xl bg-neutral-900 ring-1 ring-[var(--ring)] px-4 py-3"
              >
                <span className="block w-8 h-8 rounded-full bg-neutral-800 ring-2 ring-[var(--accent)] overflow-hidden shrink-0">
                  {m.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.avatar_url}
                      alt={m.display_name}
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <span className="flex items-center justify-center w-full h-full text-xs font-bold text-white">
                      {m.short_name[0]}
                    </span>
                  )}
                </span>
                <span className="text-sm font-medium text-white">{m.display_name}</span>
              </div>
            ))}
          </div>
        )}
        {groupId && (
          <button
            onClick={handleLeave}
            disabled={leaving}
            className="mt-4 text-xs text-neutral-500 hover:text-[var(--accent)] transition-colors disabled:opacity-50"
          >
            {leaving ? "Leaving…" : "Leave buddy group"}
          </button>
        )}
      </section>
    </div>
  );
}
