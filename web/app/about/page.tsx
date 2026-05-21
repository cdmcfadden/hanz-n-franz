export const metadata = { title: "About — C.A.D.E.T." };

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-xl px-4 sm:px-6 py-4 sm:py-6 w-full">
      <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white mb-6">
        About C.A.D.E.T.
      </h1>

      <section className="mb-8">
        <h2 className="text-base font-semibold text-[var(--accent)] mb-2 uppercase tracking-wide">
          Purpose
        </h2>
        <p className="text-sm text-neutral-300 leading-relaxed">
          C.A.D.E.T. (Chris and Dave&apos;s Experimental Training) is a fitness
          companion built to help you stay consistent, stay focused on
          progression, and take the guesswork out of planning your workouts. By
          keeping the interface simple and the feedback direct, it helps you show
          up, lift smart, and get stronger over time.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold text-[var(--accent)] mb-2 uppercase tracking-wide">
          Philosophy
        </h2>
        <p className="text-sm text-neutral-300 leading-relaxed mb-3">
          The core concept behind C.A.D.E.T. is the <strong className="text-white">working weight</strong>.
          Your working weight is the heaviest weight you can lift for 4 to 8
          repetitions — not a max effort, but the weight you can sustain through
          multiple challenging sets.
        </p>
        <p className="text-sm text-neutral-300 leading-relaxed mb-3">
          In practice, you&apos;ll do a warmup set or two at lighter weights,
          then work up to your working weight. For example, you might press 100
          lbs, then 120 lbs, and then grind out 5 or 6 reps at 140 lbs. That
          140 lbs is your working weight.
        </p>
        <p className="text-sm text-neutral-300 leading-relaxed">
          Once you can hit 8 or more reps at your working weight, it&apos;s time
          to move up. That progression — tracking and pushing your working weight
          over time — is what C.A.D.E.T. is built around. You can watch it
          unfold on the Trends page.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold text-[var(--accent)] mb-2 uppercase tracking-wide">
          FAQ
        </h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-white mb-1">
              Why don&apos;t you record reps or effort?
            </p>
            <p className="text-sm text-neutral-300 leading-relaxed">
              We believe simpler is better. Whether you did 4 reps or 7 reps at
              150 lbs, the point is the same — 150 lbs is your working weight
              right now. If you can&apos;t do 4 reps, go lighter. If you can do
              8 or more, go heavier. All you need to track is the weight itself.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold text-[var(--accent)] mb-2 uppercase tracking-wide">
          Exercise Guidelines
        </h2>
        <ul className="text-sm text-neutral-300 leading-relaxed space-y-2 list-disc list-inside">
          <li>
            Start every session with a warmup — a short run, push-ups,
            pull-ups, or other bodyweight work.
          </li>
          <li>
            Begin each exercise with easy, light-weight sets. If you&apos;re
            unsure where to start, go lower than you think you need to.
          </li>
          <li>
            If you can complete at least 4 reps, that weight counts as
            today&apos;s working weight — log it.
          </li>
          <li>
            If you can do 8 or more reps, you can likely handle more weight next
            time.
          </li>
          <li>
            Aim for 4 to 5 sets per exercise, with at least 3 of them at your
            working weight.
          </li>
        </ul>
      </section>
    </main>
  );
}
