import { AccountView } from "./AccountView";

export default function AccountPage() {
  return (
    <main className="mx-auto max-w-xl px-4 sm:px-6 py-4 sm:py-6 w-full">
      <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white mb-6">
        Account
      </h1>
      <AccountView />
    </main>
  );
}
