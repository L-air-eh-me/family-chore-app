type ProgressBarProps = {
  title?: string;
  value: number;
  valueLabel?: string;
  barClassName?: string;
};

export function ProgressBar({
  title = "Progress",
  value,
  valueLabel = `${value}%`,
  barClassName = "bg-emerald-500"
}: ProgressBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm font-medium text-slate-700">
        <span>{title}</span>
        <span>{valueLabel}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barClassName}`}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}
