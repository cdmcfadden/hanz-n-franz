"use client";

import { useCallback, useEffect, useState } from "react";
import { useUser } from "@/contexts/UserContext";

type Member = {
  id: string;
  display_name: string;
  short_name: string;
  avatar_url: string | null;
};

export function AccountView() {
  const { currentUser, hydrated } = useUser();
  const [inviteUrl, setInviteUrl] = useState("");
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setInviteUrl(`${window.location.origin}/buddy/join/${currentUser.id}`);
    }
  }, [currentUser?.id]);

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
