import { getDayKey, getTodayDateString } from "@/lib/date";
import { buildTaskSummary } from "@/lib/taskSummary";
import type {
  ChoreTemplate,
  DailyProgress,
  Kid,
  KidTasksResponse,
  OneTimeTask,
  ParentDashboardData
} from "@/lib/types";

const kids: Kid[] = [
  { kidId: "1", name: "Ryan", pin: "0917", active: true },
  { kidId: "2", name: "Brenden", pin: "0811", active: true },
  { kidId: "3", name: "Levi", pin: "1113", active: true },
  { kidId: "4", name: "Lareme", pin: "1215", active: true },
  { kidId: "5", name: "Benson", pin: "0218", active: true },
  { kidId: "6", name: "Rory", pin: "0720", active: true },
  { kidId: "7", name: "Declyn", pin: "1022", active: true },
  { kidId: "8", name: "Lochlyn", pin: "1024", active: true }
];

const choreTemplates: ChoreTemplate[] = [
  { templateId: "t1", kidId: "1", title: "Make bed", category: "Morning", dayOfWeek: "daily", required: true },
  { templateId: "t2", kidId: "1", title: "Empty dishwasher", category: "Kitchen", dayOfWeek: "mon", required: true },
  { templateId: "t3", kidId: "1", title: "Pack backpack", category: "Morning", dayOfWeek: "daily", required: true },
  { templateId: "t4", kidId: "2", title: "Feed dog", category: "Animals", dayOfWeek: "daily", required: true },
  { templateId: "t5", kidId: "2", title: "Take out trash", category: "Outside", dayOfWeek: "thu", required: true },
  { templateId: "t6", kidId: "2", title: "Wipe bathroom sink", category: "Bathroom", dayOfWeek: "daily", required: false },
  { templateId: "t7", kidId: "3", title: "Make bed", category: "Morning", dayOfWeek: "daily", required: true },
  { templateId: "t8", kidId: "3", title: "Match socks", category: "Laundry", dayOfWeek: "wed", required: true },
  { templateId: "t9", kidId: "3", title: "Read 20 minutes", category: "School", dayOfWeek: "daily", required: true },
  { templateId: "t10", kidId: "4", title: "Brush dog", category: "Animals", dayOfWeek: "fri", required: true },
  { templateId: "t11", kidId: "4", title: "Clear table", category: "Kitchen", dayOfWeek: "daily", required: true },
  { templateId: "t12", kidId: "4", title: "Put shoes away", category: "Room", dayOfWeek: "daily", required: true },
  { templateId: "t13", kidId: "5", title: "Make bed", category: "Morning", dayOfWeek: "daily", required: true },
  { templateId: "t14", kidId: "5", title: "Fold towels", category: "Laundry", dayOfWeek: "tue", required: true },
  { templateId: "t15", kidId: "5", title: "Feed chickens", category: "Animals", dayOfWeek: "daily", required: true },
  { templateId: "t16", kidId: "6", title: "Unload groceries", category: "Kitchen", dayOfWeek: "sat", required: true },
  { templateId: "t17", kidId: "6", title: "Pick up toys", category: "Room", dayOfWeek: "daily", required: true },
  { templateId: "t18", kidId: "6", title: "Homework check", category: "School", dayOfWeek: "daily", required: true },
  { templateId: "t19", kidId: "7", title: "Sweep entry", category: "House", dayOfWeek: "sun", required: true },
  { templateId: "t20", kidId: "7", title: "Make bed", category: "Morning", dayOfWeek: "daily", required: true },
  { templateId: "t21", kidId: "7", title: "Water plants", category: "Outside", dayOfWeek: "daily", required: false },
  { templateId: "t22", kidId: "8", title: "Put dishes in sink", category: "Kitchen", dayOfWeek: "daily", required: true },
  { templateId: "t23", kidId: "8", title: "Tidy room", category: "Room", dayOfWeek: "daily", required: true },
  { templateId: "t24", kidId: "8", title: "Carry recycling out", category: "Outside", dayOfWeek: "mon", required: true }
];

const initialToday = getTodayDateString();

const oneTimeTasks: OneTimeTask[] = [
  { taskId: "o1", date: initialToday, kidId: "3", title: "Clean garage section", category: "Today Only", required: true },
  { taskId: "o2", date: initialToday, kidId: "5", title: "Yard cleanup", category: "Today Only", required: true }
];

const progressStore = new Map<string, DailyProgress[]>();

function buildStoreKey(date: string, kidId: string) {
  return `${date}::${kidId}`;
}

function buildInitialProgress(date: string, kidId: string) {
  const dayKey = getDayKey(date);
  const recurring = choreTemplates
    .filter((template) => template.kidId === kidId)
    .filter((template) => template.dayOfWeek === "daily" || template.dayOfWeek === dayKey)
    .map<DailyProgress>((template) => ({
      date,
      kidId,
      taskId: template.templateId,
      taskType: "template",
      title: template.title,
      category: template.category,
      required: template.required,
      status: "not-started",
      startedAt: null,
      completedAt: null,
      durationSeconds: 0,
      submitted: false,
      note: ""
    }));

  const oneTime = oneTimeTasks
    .filter((task) => task.kidId === kidId && task.date === date)
    .map<DailyProgress>((task) => ({
      date,
      kidId,
      taskId: task.taskId,
      taskType: "one-time",
      title: task.title,
      category: task.category,
      required: task.required,
      status: "not-started",
      startedAt: null,
      completedAt: null,
      durationSeconds: 0,
      submitted: false,
      note: ""
    }));

  return [...recurring, ...oneTime].sort((left, right) => {
    if (left.category === right.category) {
      return left.title.localeCompare(right.title);
    }

    return left.category.localeCompare(right.category);
  });
}

function ensureDailyProgress(date: string, kidId: string) {
  const storeKey = buildStoreKey(date, kidId);
  const existing = progressStore.get(storeKey);

  if (existing) {
    return existing;
  }

  const created = buildInitialProgress(date, kidId);
  progressStore.set(storeKey, created);
  return created;
}

export function listKids() {
  return kids.filter((kid) => kid.active);
}

export function getKidById(kidId: string) {
  return kids.find((kid) => kid.kidId === kidId) ?? null;
}

export function verifyKidPin(kidId: string, pin: string) {
  const kid = getKidById(kidId);
  return Boolean(kid && kid.pin === pin);
}

export function getTodayTasksForKid(kidId: string, date = getTodayDateString()): KidTasksResponse {
  const kid = getKidById(kidId);

  if (!kid) {
    throw new Error("Kid not found");
  }

  const tasks = ensureDailyProgress(date, kidId);

  return {
    date,
    kid: {
      kidId: kid.kidId,
      name: kid.name
    },
    tasks,
    submitted: tasks.length > 0 && tasks.every((task) => task.submitted),
    summary: buildTaskSummary(tasks)
  };
}

export function updateTaskProgress(input: {
  kidId: string;
  taskId: string;
  date?: string;
  status?: DailyProgress["status"];
  note?: string;
}) {
  const date = input.date ?? getTodayDateString();
  const tasks = ensureDailyProgress(date, input.kidId);
  const task = tasks.find((item) => item.taskId === input.taskId);

  if (!task) {
    throw new Error("Task not found");
  }

  if (input.status) {
    if (input.status === "in-progress") {
      task.startedAt = task.startedAt ?? new Date().toISOString();
      task.completedAt = null;
      task.durationSeconds = 0;
    }

    if (input.status === "done") {
      const now = new Date().toISOString();
      const startedAt = task.startedAt ?? now;
      task.startedAt = startedAt;
      task.completedAt = now;
      task.durationSeconds = Math.max(
        0,
        Math.floor((new Date(now).getTime() - new Date(startedAt).getTime()) / 1000)
      );
    }

    if (input.status === "not-started") {
      task.startedAt = null;
      task.completedAt = null;
      task.durationSeconds = 0;
    }

    task.status = input.status;
    if (input.status !== "done") {
      task.submitted = false;
    }
  }

  if (typeof input.note === "string") {
    task.note = input.note;
  }

  return task;
}

export function submitKidForReview(kidId: string, date = getTodayDateString()) {
  const tasks = ensureDailyProgress(date, kidId);
  const summary = buildTaskSummary(tasks);

  if (summary.completedRequiredTasks !== summary.requiredTasks) {
    throw new Error("Finish required chores before submitting for parent review");
  }

  tasks.forEach((task) => {
    task.submitted = true;
  });

  return getTodayTasksForKid(kidId, date);
}

export function resetDay(date = getTodayDateString()) {
  kids.forEach((kid) => {
    progressStore.delete(buildStoreKey(date, kid.kidId));
  });

  return getParentDashboard(date);
}

export function getParentDashboard(date = getTodayDateString()): ParentDashboardData {
  const summaries = listKids().map((kid) => {
    const tasks = ensureDailyProgress(date, kid.kidId);
    const summary = buildTaskSummary(tasks);

    return {
      kidId: kid.kidId,
      kidName: kid.name,
      ...summary
    };
  });

  return {
    date,
    kids: summaries
  };
}
