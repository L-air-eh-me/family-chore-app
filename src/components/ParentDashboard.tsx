"use client";

import { useEffect, useState, useTransition } from "react";

import { KidCard } from "@/components/KidCard";
import { formatFriendlyDate } from "@/lib/date";
import type { ParentDashboardData } from "@/lib/types";

type ParentDashboardProps = {
  initialData: ParentDashboardData;
};

export function ParentDashboard({ initialData }: ParentDashboardProps) {
  const [data, setData] = useState(initialData);
  const [isPending, startTransition] = useTransition();
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void (async () => {
        const response = await fetch("/api/progress", { cache: "no-store" });
        if (response.ok) {
          const nextData = (await response.json()) as ParentDashboardData;
          startTransition(() => {
            setData(nextData);
          });
        }
      })();
    }, 5000);

    return () => window.clearInterval(timer);
  }, []);

  async function refresh() {
    const response = await fetch("/api/progress", { cache: "no-store" });
    if (response.ok) {
      const nextData = (await response.json()) as ParentDashboardData;
      startTransition(() => {
        setData(nextData);
      });
    }
  }

  async function resetDay() {
    setIsResetting(true);

    try {
      const response = await fetch("/api/reset", {
        method: "POST"
      });

      if (response.ok) {
        const nextData = (await response.json()) as ParentDashboardData;
        startTransition(() => {
          setData(nextData);
        });
      }
    } finally {
      setIsResetting(false);
    }
  }

  const submittedCount = data.kids.filter((kid) => kid.submitted).length;
  const inProgressCount = data.kids.filter((kid) => kid.status === "in-progress").length;
  const notStartedCount = data.kids.filter((kid) => kid.status === "not-started").length;
  const actionCount = data.kids.filter((kid) => kid.status === "not-started" || kid.status === "in-progress").length;

  const orderedKids = [...data.kids].sort((left, right) => {
    const rank = {
      "not-started": 0,
      "in-progress": 1,
      done: 2,
      submitted: 3
    } as const;

    if (rank[left.status] !== rank[right.status]) {
      return rank[left.status] - rank[right.status];
    }

    if (left.completionPercent !== right.completionPercent) {
      return left.completionPercent - right.completionPercent;
    }

    return left.kidName.localeCompare(right.kidName);
  });

  const nextUp = orderedKids.filter((kid) => kid.status === "not-started" || kid.status === "in-progress").slice(0, 3);

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] bg-slate-900 text-white shadow-xl">
        <div className="bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent_45%)] px-5 py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-slate-300">Parent dashboard</p>
            <h1 className="mt-2 text-3xl font-semibold">Whole family at a glance</h1>
            <p className="mt-2 max-w-xl text-sm text-slate-300">
              {formatFriendlyDate(data.date)}. See who has not started, who is halfway done, and who already submitted.
            </p>
          </div>
          <div className="rounded-[1.6rem] bg-white/10 px-4 py-4 text-right backdrop-blur">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Need parent eyes</p>
            <p className="mt-1 text-3xl font-semibold">{actionCount}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div className="rounded-2xl border border-rose-300/20 bg-rose-400/20 px-4 py-3 backdrop-blur">
            <p className="text-rose-100">Not started</p>
            <p className="mt-1 text-2xl font-semibold">{notStartedCount}</p>
          </div>
          <div className="rounded-2xl border border-amber-300/20 bg-amber-400/20 px-4 py-3 backdrop-blur">
            <p className="text-amber-100">In progress</p>
            <p className="mt-1 text-2xl font-semibold">{inProgressCount}</p>
          </div>
          <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/20 px-4 py-3 backdrop-blur">
            <p className="text-emerald-100">Ready</p>
            <p className="mt-1 text-2xl font-semibold">{data.kids.filter((kid) => kid.status === "done").length}</p>
          </div>
          <div className="rounded-2xl border border-sky-300/20 bg-sky-400/20 px-4 py-3 backdrop-blur">
            <p className="text-sky-100">Submitted</p>
            <p className="mt-1 text-2xl font-semibold">{submittedCount}</p>
          </div>
        </div>

        {nextUp.length > 0 ? (
          <div className="mt-6 rounded-[1.6rem] border border-white/10 bg-white/6 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">Kids needing attention</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {nextUp.map((kid) => (
                <span
                  key={kid.kidId}
                  className="inline-flex rounded-full bg-white px-3 py-2 text-sm font-semibold text-slate-900"
                >
                  {kid.kidName}
                  {kid.missingChores.length > 0 ? ` • ${kid.missingChores.length} left` : ""}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-rose-100 px-3 py-1 text-rose-800">Red chores = Not started</span>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-900">Yellow chores = Working</span>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-900">Green chores = Done</span>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={refresh}
            className="rounded-full bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            {isPending ? "Refreshing..." : "Refresh dashboard"}
          </button>
          <button
            type="button"
            onClick={resetDay}
            className="rounded-full border border-white/20 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            {isResetting ? "Resetting..." : "Reset today"}
          </button>
        </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {orderedKids.map((kid) => (
          <KidCard key={kid.kidId} kid={kid} />
        ))}
      </section>
    </div>
  );
}
