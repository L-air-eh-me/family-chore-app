"use client";

import { useEffect, useState } from "react";

import { formatDuration, formatFriendlyTime, getElapsedSeconds } from "@/lib/date";
import type { TodayTask } from "@/lib/types";

type ChoreChecklistProps = {
  tasks: TodayTask[];
  savingTaskId: string | null;
  onAdvanceTask: (taskId: string, status: TodayTask["status"]) => void;
  onUpdateNote: (taskId: string, note: string) => void;
};

const taskStyles: Record<TodayTask["status"], string> = {
  "not-started": "border-rose-200 bg-rose-50",
  "in-progress": "border-amber-200 bg-amber-50",
  done: "border-emerald-200 bg-emerald-50"
};

const iconStyles: Record<TodayTask["status"], string> = {
  "not-started": "border-rose-300 bg-rose-100 text-rose-700",
  "in-progress": "border-amber-300 bg-amber-100 text-amber-700",
  done: "border-emerald-500 bg-emerald-500 text-white"
};

const statusLabels: Record<TodayTask["status"], string> = {
  "not-started": "Not started",
  "in-progress": "Working on it",
  done: "Done"
};

function getNextStatus(status: TodayTask["status"]): TodayTask["status"] {
  if (status === "not-started") {
    return "in-progress";
  }

  if (status === "in-progress") {
    return "done";
  }

  return "not-started";
}

export function ChoreChecklist({
  tasks,
  savingTaskId,
  onAdvanceTask,
  onUpdateNote
}: ChoreChecklistProps) {
  const [, setClockTick] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setClockTick(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const groups = tasks.reduce<Record<string, TodayTask[]>>((record, task) => {
    record[task.category] = [...(record[task.category] ?? []), task];
    return record;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(groups).map(([category, categoryTasks]) => (
        <section key={category} className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">{category}</h3>
            <span className="text-xs text-slate-400">{categoryTasks.length} tasks</span>
          </div>
          <div className="space-y-3">
            {categoryTasks.map((task) => (
              <article
                key={task.taskId}
                className={`rounded-[2rem] border px-5 py-5 transition ${taskStyles[task.status]}`}
              >
                <button
                  type="button"
                  onClick={() => onAdvanceTask(task.taskId, getNextStatus(task.status))}
                  className="flex min-h-24 w-full items-start gap-4 text-left"
                >
                  <span
                    className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-base font-bold ${iconStyles[task.status]}`}
                  >
                    {task.status === "not-started" ? "!" : task.status === "in-progress" ? "•" : "✓"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xl font-semibold text-slate-900">{task.title}</span>
                    <span className="mt-1 block text-base text-slate-600">
                      {task.required ? "Required" : "Optional"} • {statusLabels[task.status]}
                      {task.completedAt ? ` • Saved ${formatFriendlyTime(task.completedAt)}` : ""}
                      {savingTaskId === task.taskId ? " • Saving..." : ""}
                    </span>
                    <span className="mt-2 block text-base font-medium text-slate-700">
                      Time: {formatDuration(
                        getElapsedSeconds(task.startedAt, task.durationSeconds, task.status === "in-progress")
                      )}
                    </span>
                    <span className="mt-3 inline-flex rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700">
                      Tap to {task.status === "not-started" ? "start" : task.status === "in-progress" ? "mark done" : "reset"}
                    </span>
                  </span>
                </button>
                <div className="mt-3">
                  <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Optional note
                  </label>
                  <input
                    value={task.note}
                    onChange={(event) => onUpdateNote(task.taskId, event.target.value)}
                    placeholder="Anything parent should know?"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base text-slate-700 outline-none transition focus:border-slate-400"
                  />
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
