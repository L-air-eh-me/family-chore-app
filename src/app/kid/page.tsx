"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import { ChoreChecklist } from "@/components/ChoreChecklist";
import { KidSelector } from "@/components/KidSelector";
import { ProgressBar } from "@/components/ProgressBar";
import { formatDuration, formatFriendlyDate, getElapsedSeconds } from "@/lib/date";
import { buildTaskSummary } from "@/lib/taskSummary";
import type { KidTasksResponse, TodayTask } from "@/lib/types";

type KidListItem = {
  kidId: string;
  name: string;
};

async function readErrorMessage(response: Response, fallback: string) {
  const text = await response.text();

  if (!text) {
    return fallback;
  }

  try {
    const data = JSON.parse(text) as { error?: string };
    return data.error ?? fallback;
  } catch {
    return text;
  }
}

export default function KidPage() {
  const autoOpenedRef = useRef(false);
  const [kids, setKids] = useState<KidListItem[]>([]);
  const [selectedKidId, setSelectedKidId] = useState("");
  const [pin, setPin] = useState("");
  const [quickAccess, setQuickAccess] = useState(false);
  const [error, setError] = useState("");
  const [taskData, setTaskData] = useState<KidTasksResponse | null>(null);
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);
  const [isLoading, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [, setClockTick] = useState(Date.now());

  useEffect(() => {
    async function loadKids() {
      setError("");

      const response = await fetch("/api/kids");

      if (!response.ok) {
        setError(await readErrorMessage(response, "Unable to load kids."));
        return;
      }

      const data = (await response.json()) as KidListItem[];
      setKids(data);

      if (data.length === 0) {
        setError("No active kids were found in the Google Sheet.");
      }
    }

    void loadKids();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setClockTick(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const completionPercent = taskData?.summary.completionPercent ?? 0;
  const totalDurationSeconds = taskData
    ? taskData.tasks.reduce(
        (sum, task) => sum + getElapsedSeconds(task.startedAt, task.durationSeconds, task.status === "in-progress"),
        0
      )
    : 0;
  const kidByNormalizedName = useMemo(
    () =>
      kids.reduce<Record<string, KidListItem>>((record, kid) => {
        record[kid.name.toLowerCase().replace(/[^a-z0-9]/g, "")] = kid;
        return record;
      }, {}),
    [kids]
  );

  async function openChecklist(options: {
    kidId: string;
    pin?: string;
    quick?: boolean;
    remember?: boolean;
  }) {
    const query = new URLSearchParams({
      kidId: options.kidId
    });

    if (options.pin) {
      query.set("pin", options.pin);
    }

    if (options.quick) {
      query.set("quick", "1");
    }

    const response = await fetch(`/api/chores?${query.toString()}`);

    if (!response.ok) {
      setError(await readErrorMessage(response, "Unable to load chores."));
      return false;
    }

    const nextTaskData = (await response.json()) as KidTasksResponse;
    setSelectedKidId(options.kidId);
    setQuickAccess(Boolean(options.quick));
    if (options.pin) {
      setPin(options.pin);
    }

    if (options.remember) {
      const rememberedKid = kids.find((kid) => kid.kidId === options.kidId);
      if (rememberedKid) {
        window.localStorage.setItem(
          "family-chore-last-kid",
          JSON.stringify({
            kidId: rememberedKid.kidId,
            name: rememberedKid.name,
            pin: options.pin ?? ""
          })
        );
      }
    }

    startTransition(() => {
      setTaskData(nextTaskData);
    });

    return true;
  }

  async function unlockChecklist() {
    setError("");
    setFeedback("");

    if (!selectedKidId || !pin) {
      setError("Choose a child and enter the PIN.");
      return;
    }

    await openChecklist({
      kidId: selectedKidId,
      pin,
      remember: true
    });
  }

  useEffect(() => {
    if (kids.length === 0 || autoOpenedRef.current) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const nameParam = params.get("name");
    const rememberedRaw = window.localStorage.getItem("family-chore-last-kid");
    const remembered = rememberedRaw ? (JSON.parse(rememberedRaw) as { kidId?: string; name?: string; pin?: string }) : null;

    async function tryAutoOpen() {
      if (nameParam) {
        const normalized = nameParam.toLowerCase().replace(/[^a-z0-9]/g, "");
        const kid = kidByNormalizedName[normalized];

        if (kid) {
          autoOpenedRef.current = true;
          setSelectedKidId(kid.kidId);

          if (remembered?.kidId === kid.kidId && remembered.pin) {
            await openChecklist({ kidId: kid.kidId, pin: remembered.pin, remember: true });
          } else {
            await openChecklist({ kidId: kid.kidId, quick: true });
          }
          return;
        }
      }

      if (remembered?.kidId) {
        autoOpenedRef.current = true;
        setSelectedKidId(remembered.kidId);
        if (remembered.pin) {
          await openChecklist({ kidId: remembered.kidId, pin: remembered.pin, remember: true });
        }
      }
    }

    void tryAutoOpen();
  }, [kids, kidByNormalizedName]);

  async function advanceTask(taskId: string, status: TodayTask["status"]) {
    if (!taskData) {
      return;
    }

    setSavingTaskId(taskId);

    const response = await fetch("/api/progress", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        kidId: taskData.kid.kidId,
        pin,
        quickAccess,
        taskId,
        status
      })
    });

    if (response.ok) {
      const updatedTask = (await response.json()) as {
        taskId: string;
        status: TodayTask["status"];
        startedAt: string | null;
        completedAt: string | null;
        durationSeconds: number;
        note: string;
        submitted: boolean;
      };
      setTaskData((current) =>
        current
          ? (() => {
              const tasks = current.tasks.map((task) =>
                task.taskId === updatedTask.taskId
                  ? {
                      ...task,
                      status: updatedTask.status,
                      startedAt: updatedTask.startedAt,
                      completedAt: updatedTask.completedAt,
                      durationSeconds: updatedTask.durationSeconds,
                      note: updatedTask.note,
                      submitted: updatedTask.submitted
                    }
                  : task
              );
              const summary = buildTaskSummary(tasks);

              return {
                ...current,
                tasks,
                submitted: summary.submitted,
                summary
              };
            })()
          : current
      );
      setFeedback("Progress saved.");
    } else {
      setError(await readErrorMessage(response, "Unable to save progress."));
    }

    setSavingTaskId(null);
  }

  async function updateNote(taskId: string, note: string) {
    if (!taskData) {
      return;
    }

    setFeedback("");
    setTaskData((current) =>
      current
        ? {
            ...current,
            tasks: current.tasks.map((task) => (task.taskId === taskId ? { ...task, note } : task))
          }
        : current
    );

    await fetch("/api/progress", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        kidId: taskData.kid.kidId,
        pin,
        quickAccess,
        taskId,
        note
      })
    });
  }

  async function submitForReview() {
    if (!taskData) {
      return;
    }

    setIsSubmitting(true);
    setError("");
    setFeedback("");

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          kidId: taskData.kid.kidId,
          pin,
          quickAccess
        })
      });

      if (response.ok) {
        setTaskData((await response.json()) as KidTasksResponse);
        setFeedback("Submitted for parent review.");
      } else {
        setError(await readErrorMessage(response, "Unable to submit for review."));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const canSubmit =
    taskData !== null &&
    savingTaskId === null &&
    (taskData.summary.requiredTasks === 0 ||
      taskData.summary.completedRequiredTasks === taskData.summary.requiredTasks);

  useEffect(() => {
    if (canSubmit && error === "Finish required chores before submitting for parent review") {
      setError("");
      setQuickAccess(false);
    }
  }, [canSubmit, error]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <section className="rounded-[2rem] bg-white px-5 py-6 shadow-sm ring-1 ring-slate-100">
          <p className="text-sm uppercase tracking-[0.22em] text-slate-500">Kid checklist</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Today&apos;s chores</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Pick your name once, then get back here in one or two taps. Every chore save happens right away.
          </p>

          {!taskData ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-[1.6rem] bg-slate-50 px-4 py-4 text-sm text-slate-600">
                <p className="font-semibold text-slate-900">Fast access</p>
                <p className="mt-1">
                  Use a direct link like <span className="font-semibold text-slate-900">`/kid?name=Ryan`</span>, or log in once and this device will remember that child.
                </p>
              </div>
              {kids.length === 0 ? (
                <div className="rounded-[1.6rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600">
                  Waiting for kids to load from Google Sheets.
                </div>
              ) : null}
              <KidSelector kids={kids} selectedKidId={selectedKidId} onSelect={setSelectedKidId} />
              <div className="space-y-3">
                <label htmlFor="pin" className="block text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Enter PIN
                </label>
                <input
                  id="pin"
                  inputMode="numeric"
                  value={pin}
                  onChange={(event) => setPin(event.target.value)}
                  placeholder="4-digit PIN"
                  className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-5 text-xl font-semibold text-slate-900 outline-none transition focus:border-slate-400"
                />
              </div>
              {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
              <button
                type="button"
                onClick={unlockChecklist}
                disabled={kids.length === 0}
                className="w-full rounded-full bg-slate-900 px-5 py-5 text-lg font-semibold text-white transition hover:bg-slate-800"
              >
                {isLoading ? "Opening..." : "Open my chores"}
              </button>
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              <div className="rounded-[1.6rem] bg-slate-900 px-5 py-5 text-white">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-slate-300">{formatFriendlyDate(taskData.date)}</p>
                    <h2 className="mt-1 text-2xl font-semibold">{taskData.kid.name}</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTaskData(null);
                      setPin("");
                      setQuickAccess(false);
                      setError("");
                    }}
                    className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Switch child
                  </button>
                </div>

                <div className="mt-5 rounded-[1.4rem] bg-white px-4 py-4 text-slate-900">
                  <ProgressBar value={completionPercent} />
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                    <span>{taskData.summary.totalTasks} chores today</span>
                    <span>{taskData.summary.requiredTasks} required</span>
                    <span>{taskData.summary.completedTasks} done</span>
                    <span>Total time {formatDuration(totalDurationSeconds)}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-rose-100 px-3 py-1 text-rose-800">Red = Not started</span>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-900">Yellow = Working</span>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-900">Green = Done</span>
                  </div>
                </div>
              </div>

              {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p> : null}
              {feedback ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{feedback}</p> : null}

              <ChoreChecklist
                tasks={taskData.tasks}
                savingTaskId={savingTaskId}
                onAdvanceTask={advanceTask}
                onUpdateNote={updateNote}
              />

              <button
                type="button"
                onClick={submitForReview}
                disabled={!canSubmit || isSubmitting}
                className="w-full rounded-full bg-emerald-500 px-6 py-6 text-xl font-semibold text-white shadow-xl transition enabled:hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-200"
              >
                {taskData.submitted
                  ? "Submitted for parent review"
                  : isSubmitting
                    ? "Submitting..."
                    : canSubmit
                      ? "Done for parent review"
                      : savingTaskId
                        ? "Saving latest chore..."
                        : "Finish required chores to submit"}
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
