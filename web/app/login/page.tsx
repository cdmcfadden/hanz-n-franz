import { GoogleSignInButton } from "./GoogleSignInButton";

export const metadata = { title: "Sign in — C.A.D.E.T." };

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-[var(--bg)]">
      <div className="w-full max-w-sm text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/cadet-icon.png"
          alt="C.A.D.E.T."
          width={80}
          height={80}
          className="mx-auto mb-6 rounded-2xl ring-1 ring-[var(--ring)]"
        />
        <h1 className="text-2xl font-semibold text-white mb-1">C.A.D.E.T.</h1>
        <p className="text-sm text-neutral-400 mb-8">
          Chris &amp; Dave&apos;s Experimental Training
        </p>
        <GoogleSignInButton />
      </div>
    </main>
  );
}
