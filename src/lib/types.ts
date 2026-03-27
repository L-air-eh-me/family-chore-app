export type DayKey =
  | "daily"
  | "mon"
  | "tue"
  | "wed"
  | "thu"
  | "fri"
  | "sat"
  | "sun";

export type Kid = {
  kidId: string;
  name: string;
  pin: string;
  active: boolean;
};

export type ChoreTemplate = {
  templateId: string;
  kidId: string;
  title: string;
  category: string;
  dayOfWeek: DayKey;
  required: boolean;
};

export type OneTimeTask = {
  taskId: string;
  date: string;
  kidId: string;
  title: string;
  category: string;
  required: boolean;
};

export type DailyProgress = {
  date: string;
  kidId: string;
  taskId: string;
  taskType: "template" | "one-time";
  title: string;
  category: string;
  required: boolean;
  status: "not-started" | "in-progress" | "done";
  startedAt: string | null;
  completedAt: string | null;
  durationSeconds: number;
  submitted: boolean;
  note: string;
};

export type TodayTask = DailyProgress;

export type KidStatus = "not-started" | "in-progress" | "done" | "submitted";

export type KidSummary = {
  kidId: string;
  kidName: string;
  totalTasks: number;
  completedTasks: number;
  requiredTasks: number;
  completedRequiredTasks: number;
  submitted: boolean;
  status: KidStatus;
  completionPercent: number;
  missingChores: string[];
  notes: Array<{
    taskTitle: string;
    note: string;
  }>;
  taskStatuses: Array<{
    taskId: string;
    taskTitle: string;
    status: DailyProgress["status"];
    required: boolean;
    startedAt: string | null;
    durationSeconds: number;
  }>;
  totalDurationSeconds: number;
};

export type TaskSummary = {
  totalTasks: number;
  completedTasks: number;
  requiredTasks: number;
  completedRequiredTasks: number;
  submitted: boolean;
  status: KidStatus;
  completionPercent: number;
  missingChores: string[];
  notes: Array<{
    taskTitle: string;
    note: string;
  }>;
  taskStatuses: Array<{
    taskId: string;
    taskTitle: string;
    status: DailyProgress["status"];
    required: boolean;
    startedAt: string | null;
    durationSeconds: number;
  }>;
  totalDurationSeconds: number;
};

export type ParentDashboardData = {
  date: string;
  kids: KidSummary[];
};

export type KidTasksResponse = {
  date: string;
  kid: Pick<Kid, "kidId" | "name">;
  tasks: TodayTask[];
  submitted: boolean;
  summary: TaskSummary;
};
