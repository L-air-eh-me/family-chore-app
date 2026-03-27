import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.85),_rgba(241,245,249,1)_55%,_rgba(226,232,240,1))]">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-4 py-10 sm:px-6">
        <section className="overflow-hidden rounded-[2rem] bg-slate-900 text-white shadow-2xl">
          <div className="grid gap-10 px-6 py-8 sm:px-8 lg:grid-cols-[1.2fr_0.8fr] lg:px-10 lg:py-12">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-300">Family chore app</p>
              <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
                Simpler for kids than a form. Faster for parents than a clipboard.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                Each child sees only today&apos;s chores, every checkmark saves right away, and the parent dashboard shows all 8 kids in one quick scan.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/kid"
                  className="inline-flex items-center justify-center rounded-full bg-amber-300 px-6 py-4 text-base font-semibold text-slate-900 transition hover:bg-amber-200"
                >
                  Open kid checklist
                </Link>
                <Link
                  href="/parent"
                  className="inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-4 text-base font-semibold text-white transition hover:bg-white/10"
                >
                  Open parent dashboard
                </Link>
              </div>
            </div>

            <div className="grid gap-3 self-end">
              <div className="rounded-[1.6rem] bg-white/10 p-5 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">What changes</p>
                <p className="mt-3 text-lg font-semibold">Parents no longer wait for one final form submission.</p>
              </div>
              <div className="rounded-[1.6rem] bg-white/10 p-5 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Live visibility</p>
                <p className="mt-3 text-lg font-semibold">See not started, in progress, done, and submitted in one dashboard.</p>
              </div>
              <div className="rounded-[1.6rem] bg-white/10 p-5 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Built for chaos</p>
                <p className="mt-3 text-lg font-semibold">Large buttons, clean text, and no extra steps for a busy family.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
