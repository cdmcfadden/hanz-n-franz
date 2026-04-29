export type BuddyUser = {
  id: string;
  name: string;
  shortName: string;
  color: string;
};

export const BUDDY_COLORS = ["#60a5fa", "#ef4444", "#34d399", "#fbbf24"] as const;
