import { getElapsedSeconds } from "@/lib/date";
import type { DailyProgress, TaskSummary } from "@/lib/types";

export function buildTaskSummary(tasks: DailyProgress[]): TaskSummary {
  const requiredTasks = tasks.filter((task) => task.required);
  const completedTasks = tasks.filter((task) => task.status === "done").length;
  const completedRequiredTasks = requiredTasks.filter((task) => task.status === "done").length;
  const submitted = tasks.length > 0 && tasks.every((task) => task.submitted);
  const anyStarted = tasks.some((task) => task.status !== "not-started");
  const allRequiredComplete = requiredTasks.every((task) => task.status === "done");
  const completionPercent =
    requiredTasks.length === 0 ? 100 : Math.round((completedRequiredTasks / requiredTasks.length) * 100);

  const status = submitted
    ? "submitted"
    : !anyStarted
      ? "not-started"
      : allRequiredComplete
        ? "done"
        : "in-progress";

  return {
    totalTasks: tasks.length,
    completedTasks,
    requiredTasks: requiredTasks.length,
    completedRequiredTasks,
    submitted,
    status,
    completionPercent,
    missingChores: tasks.filter((task) => task.required && task.status !== "done").map((task) => task.title),
    notes: tasks
      .filter((task) => task.note.trim().length > 0)
      .map((task) => ({
        taskTitle: task.title,
        note: task.note.trim()
      })),
    taskStatuses: tasks.map((task) => ({
      taskId: task.taskId,
      taskTitle: task.title,
      status: task.status,
      required: task.required,
      startedAt: task.startedAt,
      durationSeconds: task.durationSeconds
    })),
    totalDurationSeconds: tasks.reduce(
      (sum, task) => sum + getElapsedSeconds(task.startedAt, task.durationSeconds, task.status === "in-progress"),
      0
    )
  };
}
