export const ADMIN_USER_IDS = [
  "4291b0b5-41d7-4a04-b138-90a578193e71", // Dave
  "67772697-6da4-49fd-93f0-87af75befc99", // Chris
] as const;

export function isAdmin(userId: string): boolean {
  return (ADMIN_USER_IDS as readonly string[]).includes(userId);
}
