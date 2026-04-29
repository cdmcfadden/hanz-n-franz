"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  inviterId: string;
  inviterName: string;
  inviterAvatar: string | null;
  isSelf: boolean;
  alreadyInGroup: boolean;
  groupFull: boolean;
};

export function JoinConfirmation({
  inviterId,
  inviterName,
  inviterAvatar,
  isSelf,
  alreadyInGroup,
  groupFull,
}: Props) {
  const router = useRouter();
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isSelf) {
    return (
      <div className="text-center space-y-4">
        <p className="text-neutral-400">That&apos;s your own buddy link.</p>
        <a href="/account" className="text-sm text-[var(--accent)] hover:underline">
          ← Back to Account
        </a>
      </div>
    );
  }

  if (alreadyInGroup) {
    return (
      <div className="text-center space-y-4">
        <p className="text-neutral-400">You&apos;re already in a buddy group.</p>
        <p className="text-sm text-neutral-500">
          Leave your current group from the{" "}
          <a href="/account" className="underline hover:text-white">
            Account page
          </a>{" "}
          first.
        </p>
      </div>
    );
  }

  if (groupFull) {
    return (
      <div className="text-center space-y-4">
        <p className="text-neutral-400">This buddy group is full (max 4).</p>
        <a href="/account" className="text-sm text-[var(--accent)] hover:underline">
          ← Back to Account
        </a>
      </div>
    );
  }

  async function handleJoin() {
    setJoining(true);
    setError(null);
    try {
      const res = await fetch("/api/buddy/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviterId }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError((d as { error?: string }).error ?? "Something went wrong");
        return;
      }
      router.push("/account");
    } catch {
      setError("Something went wrong");
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="text-center space-y-6">
      <div className="mx-auto w-20 h-20 rounded-full overflow-hidden bg-neutral-800 ring-2 ring-[var(--accent)]">
        {inviterAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={inviterAvatar}
            alt={inviterName}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <span className="flex items-center justify-center w-full h-full text-2xl font-bold text-white">
            {inviterName[0]}
          </span>
        )}
      </div>

      <div>
        <h1 className="text-xl font-semibold text-white mb-1">
          Join {inviterName}&apos;s buddy group?
        </h1>
        <p className="text-sm text-neutral-500">
          You&apos;ll see each other&apos;s progress on the Trends page.
        </p>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-3 justify-center">
        <button
          onClick={() => router.push("/account")}
          className="px-6 py-2.5 rounded-full text-sm font-medium text-neutral-400 hover:text-white bg-neutral-900 ring-1 ring-[var(--ring)] hover:bg-neutral-800 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleJoin}
          disabled={joining}
          className="px-6 py-2.5 rounded-full text-sm font-semibold text-black bg-white hover:bg-neutral-200 transition-colors disabled:opacity-50"
        >
          {joining ? "Joining…" : "Join"}
        </button>
      </div>
    </div>
  );
}
