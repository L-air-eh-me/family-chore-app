import type { KidStatus } from "@/lib/types";

const badgeStyles: Record<KidStatus, string> = {
  "not-started": "border border-rose-200 bg-rose-100 text-rose-900",
  "in-progress": "border border-amber-200 bg-amber-100 text-amber-900",
  done: "border border-emerald-200 bg-emerald-100 text-emerald-900",
  submitted: "border border-sky-200 bg-sky-100 text-sky-900"
};

const labels: Record<KidStatus, string> = {
  "not-started": "Not started",
  "in-progress": "In progress",
  done: "Done",
  submitted: "Submitted for review"
};

type StatusBadgeProps = {
  status: KidStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badgeStyles[status]}`}>
      {labels[status]}
    </span>
  );
}
