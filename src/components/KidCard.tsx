import { StatusBadge } from "@/components/StatusBadge";
import { formatDuration, getElapsedSeconds } from "@/lib/date";
import type { KidStatus, KidSummary } from "@/lib/types";

type KidCardProps = {
  kid: KidSummary;
};

const accentStyles: Record<KidStatus, string> = {
  "not-started": "border-l-rose-400 bg-rose-50/40",
  "in-progress": "border-l-amber-400 bg-amber-50/40",
  done: "border-l-emerald-400 bg-emerald-50/40 ring-1 ring-emerald-100",
  submitted: "border-l-sky-400 bg-sky-50/40 ring-1 ring-sky-100"
};

const taskStatusStyles: Record<"not-started" | "in-progress" | "done", string> = {
  "not-started": "bg-rose-100 text-rose-800 ring-1 ring-rose-200",
  "in-progress": "bg-amber-100 text-amber-900 ring-1 ring-amber-200",
  done: "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200"
};

export function KidCard({ kid }: KidCardProps) {
  return (
    <article className={`rounded-3xl border border-slate-200 border-l-4 bg-white px-4 py-4 shadow-sm ${accentStyles[kid.status]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-2xl font-semibold text-slate-900">{kid.kidName}</h3>
          <p className="mt-1 text-sm text-slate-500">Today&apos;s progress</p>
        </div>
        <StatusBadge status={kid.status} />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-slate-50 px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Done</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            {kid.completedTasks}/{kid.totalTasks}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Required</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            {kid.completedRequiredTasks}/{kid.requiredTasks}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-900 px-3 py-3 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">Time</p>
          <p className="mt-1 text-2xl font-semibold">{formatDuration(kid.totalDurationSeconds)}</p>
        </div>
      </div>

      <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-slate-900 transition-all duration-300"
          style={{ width: `${kid.completionPercent}%` }}
        />
      </div>

      <div className="mt-4 border-t border-slate-100 pt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Needs attention</p>
        {kid.missingChores.length > 0 ? (
          <p className="mt-2 text-sm leading-6 text-slate-800">{kid.missingChores.join(", ")}</p>
        ) : (
          <p className="mt-2 text-sm font-medium text-emerald-700">Nothing missing.</p>
        )}
      </div>

      <div className="mt-4 border-t border-slate-100 pt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Chore status</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {kid.taskStatuses.map((task) => (
            <span
              key={`${kid.kidId}-${task.taskId}`}
              className={`inline-flex rounded-full px-3 py-2 text-xs font-semibold ${taskStatusStyles[task.status]}`}
            >
              {task.taskTitle}
              {` • ${formatDuration(getElapsedSeconds(task.startedAt, task.durationSeconds, task.status === "in-progress"))}`}
              {task.required ? "" : " (Optional)"}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Notes for parent</p>
        {kid.notes.length > 0 ? (
          <div className="mt-2 space-y-2">
            {kid.notes.map((entry) => (
              <div key={`${kid.kidId}-${entry.taskTitle}`} className="rounded-2xl bg-slate-50 px-3 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{entry.taskTitle}</p>
                <p className="mt-1 text-sm leading-6 text-slate-800">{entry.note}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-500">No notes today.</p>
        )}
      </div>
    </article>
  );
}
