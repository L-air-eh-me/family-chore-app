import type { DayKey } from "@/lib/types";

const dayMap: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const APP_TIME_ZONE = process.env.APP_TIME_ZONE || "America/Phoenix";

export function getTodayDateString() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  return formatter.format(new Date());
}

export function normalizeDateString(value: string | null | undefined) {
  const raw = String(value ?? "").trim();

  if (!raw) {
    return "";
  }

  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return raw;
  }

  const shortIsoPrefixMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/);
  if (shortIsoPrefixMatch) {
    return `${shortIsoPrefixMatch[1]}-${shortIsoPrefixMatch[2]}-${shortIsoPrefixMatch[3]}`;
  }

  const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, month, day, year] = slashMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return raw;
}

export function getDayKey(dateString: string) {
  const date = new Date(`${dateString}T12:00:00`);
  return dayMap[date.getDay()] ?? "daily";
}

export function formatFriendlyDate(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIME_ZONE,
    weekday: "short",
    month: "short",
    day: "numeric"
  }).format(new Date(`${dateString}T12:00:00`));
}

export function formatFriendlyTime(dateString: string | null) {
  if (!dateString) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(dateString));
}

export function getElapsedSeconds(
  startedAt: string | null,
  durationSeconds: number,
  isRunning = false
) {
  if (!isRunning) {
    return durationSeconds;
  }

  if (!startedAt) {
    return 0;
  }

  return Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
}

export function formatDuration(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }

  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}
