import { getTodayDateString, normalizeDateString } from "@/lib/date";
import { buildTaskSummary } from "@/lib/taskSummary";
import type { Kid, KidTasksResponse, ParentDashboardData } from "@/lib/types";

export type Repository = {
  listKids: () => Promise<Pick<Kid, "kidId" | "name" | "active">[]>;
  verifyKidPin: (kidId: string, pin: string) => Promise<boolean>;
  getTodayTasksForKid: (kidId: string, date?: string) => Promise<KidTasksResponse>;
  updateTaskProgress: (input: {
    kidId: string;
    taskId: string;
    date?: string;
    status?: "not-started" | "in-progress" | "done";
    note?: string;
  }) => Promise<void>;
  submitKidForReview: (kidId: string, date?: string) => Promise<KidTasksResponse>;
  getParentDashboard: (date?: string) => Promise<ParentDashboardData>;
  resetDay: (date?: string) => Promise<ParentDashboardData>;
};

type SheetRow = Record<string, string>;

type DailyProgressSheetRow = SheetRow & {
  date: string;
  kid_id: string;
  task_id?: string;
  template_id?: string;
  chore_title?: string;
  status?: string;
  started_at?: string;
  completed?: string;
  completed_at?: string;
  duration_seconds?: string;
  submitted?: string;
  note?: string;
};

async function getSheetsClient() {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!spreadsheetId || !clientEmail || !privateKey) {
    throw new Error("Google Sheets environment variables are missing. Set GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, and GOOGLE_SHEET_ID.");
  }

  const { google } = await import("googleapis");
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });

  return {
    spreadsheetId,
    sheets: google.sheets({ version: "v4", auth })
  };
}

function normalizeBoolean(value: unknown) {
  return String(value).trim().toLowerCase() === "true";
}

async function readTab(tabName: string) {
  const { sheets, spreadsheetId } = await getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${tabName}!A:Z`
  });

  const [header = [], ...rows] = response.data.values ?? [];
  const normalizedHeader = header.map((cell) => String(cell).trim());

  return rows.map((row) =>
    normalizedHeader.reduce<SheetRow>((record, key, index) => {
      record[key] = String(row[index] ?? "").trim();
      return record;
    }, {})
  );
}

export async function debugReadTab(tabName: string) {
  return readTab(tabName);
}

async function writeDailyProgressRows(rows: string[][]) {
  const { sheets, spreadsheetId } = await getSheetsClient();

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: "DailyProgress!A:K",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: rows
    }
  });
}

async function readDailyProgressRows() {
  const rows = await readTab("DailyProgress");

  return rows.map<DailyProgressSheetRow>((row) => ({
    ...row,
    date: normalizeDateString(row.date)
  }));
}

async function buildSheetsSnapshot(date = getTodayDateString()) {
  const targetDate = normalizeDateString(date);
  const [kidsRows, templatesRows, dailyRows, oneTimeRows] = await Promise.all([
    readTab("Kids"),
    readTab("ChoreTemplates"),
    readDailyProgressRows(),
    readTab("OneTimeTasks")
  ]);

  const activeKids = kidsRows
    .filter((row) => normalizeBoolean(row.active))
    .map((row) => ({
      kidId: row.kid_id,
      name: row.name,
      active: true,
      pin: row.pin
    }));

  const dayNames = {
    0: "sun",
    1: "mon",
    2: "tue",
    3: "wed",
    4: "thu",
    5: "fri",
    6: "sat"
  } as const;
  const dateDay = dayNames[new Date(`${targetDate}T12:00:00`).getDay() as keyof typeof dayNames];

  const templates = templatesRows
    .filter((row) => row.kid_id)
    .map((row, index) => ({
      templateId:
        row.template_id ||
        `template-${row.kid_id}-${row.day_of_week || "daily"}-${row.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${index}`,
      kidId: row.kid_id,
      title: row.title,
      category: row.category || "Chores",
      dayOfWeek: row.day_of_week.toLowerCase(),
      required: normalizeBoolean(row.required)
    }))
    .filter((row) => row.dayOfWeek === "daily" || row.dayOfWeek === dateDay);

  const oneTimeTasks = oneTimeRows
    .filter((row) => row.kid_id && normalizeDateString(row.date) === targetDate)
    .map((row, index) => ({
      taskId: row.task_id || `one-time-${targetDate}-${row.kid_id}-${index}`,
      kidId: row.kid_id,
      title: row.title,
      category: row.category || "Today Only",
      required: normalizeBoolean(row.required)
    }));

  const progressRows = dailyRows.filter((row) => normalizeDateString(row.date) === targetDate);

  const tasksByKid = new Map<string, KidTasksResponse>();

  activeKids.forEach((kid) => {
    const seededTasks: KidTasksResponse["tasks"] = [
      ...templates
        .filter((template) => template.kidId === kid.kidId)
        .map((template) => ({
          date: targetDate,
          kidId: kid.kidId,
          taskId: template.templateId,
          taskType: "template" as const,
          title: template.title,
          category: template.category,
          required: template.required,
          status: "not-started" as const,
          startedAt: null,
          completedAt: null,
          durationSeconds: 0,
          submitted: false,
          note: ""
        })),
      ...oneTimeTasks
        .filter((task) => task.kidId === kid.kidId)
        .map((task) => ({
          date: targetDate,
          kidId: kid.kidId,
          taskId: task.taskId,
          taskType: "one-time" as const,
          title: task.title,
          category: task.category,
          required: task.required,
          status: "not-started" as const,
          startedAt: null,
          completedAt: null,
          durationSeconds: 0,
          submitted: false,
          note: ""
        }))
    ];

    progressRows
      .filter((row) => row.kid_id === kid.kidId)
      .forEach((row) => {
        const taskId = row.task_id || row.template_id || row.chore_title;
        const match = seededTasks.find((task) => task.taskId === taskId || task.title === row.chore_title);
        if (match) {
          match.status = row.status === "in-progress" || row.status === "done" || row.status === "not-started"
            ? row.status
            : normalizeBoolean(row.completed)
              ? "done"
              : "not-started";
          match.startedAt = row.started_at || null;
          match.completedAt = row.completed_at || null;
          match.durationSeconds = Number(row.duration_seconds || 0);
          match.submitted = normalizeBoolean(row.submitted);
          match.note = row.note || "";
        }
      });

    tasksByKid.set(kid.kidId, {
      date: targetDate,
      kid: {
        kidId: kid.kidId,
        name: kid.name
      },
      tasks: seededTasks,
      submitted: seededTasks.length > 0 && seededTasks.every((task) => task.submitted),
      summary: buildTaskSummary(seededTasks)
    });
  });

  return {
    activeKids,
    tasksByKid,
    progressRows
  };
}

const sheetsRepository: Repository = {
  async listKids() {
    const snapshot = await buildSheetsSnapshot();
    return snapshot.activeKids.map(({ kidId, name, active }) => ({ kidId, name, active }));
  },
  async verifyKidPin(kidId, pin) {
    const snapshot = await buildSheetsSnapshot();
    const kid = snapshot.activeKids.find((entry) => entry.kidId === kidId);
    return Boolean(kid && kid.pin === pin);
  },
  async getTodayTasksForKid(kidId, date) {
    const snapshot = await buildSheetsSnapshot(date);
    const data = snapshot.tasksByKid.get(kidId);
    if (!data) {
      throw new Error("Kid not found");
    }
    return data;
  },
  async updateTaskProgress(input) {
    const date = input.date ?? getTodayDateString();
    const normalizedDate = normalizeDateString(date);
    const snapshot = await buildSheetsSnapshot(normalizedDate);
    const allDailyRows = await readDailyProgressRows();
    const taskSet = snapshot.tasksByKid.get(input.kidId);
    if (!taskSet) {
      throw new Error("Kid not found");
    }

    const updatedRows = taskSet.tasks.map((task) => {
      if (task.taskId !== input.taskId) {
        return task;
      }

      return {
        ...task,
        status: input.status ?? task.status,
        startedAt:
          input.status === "in-progress"
            ? task.startedAt ?? new Date().toISOString()
            : input.status === "not-started"
              ? null
              : task.startedAt,
        completedAt:
          input.status
            ? input.status === "done"
              ? new Date().toISOString()
              : null
            : task.completedAt,
        durationSeconds:
          input.status === "done"
            ? Math.max(
                0,
                Math.floor(
                  (new Date().getTime() - new Date(task.startedAt ?? new Date().toISOString()).getTime()) / 1000
                )
              )
            : input.status === "not-started"
              ? 0
              : task.durationSeconds,
        note: typeof input.note === "string" ? input.note : task.note,
        submitted: input.status && input.status !== "done" ? false : task.submitted
      };
    });

    const allRows = [
      ["date", "kid_id", "task_id", "chore_title", "status", "started_at", "completed", "completed_at", "duration_seconds", "submitted", "note"],
      ...allDailyRows
        .filter((row) => row.date !== normalizedDate)
        .map((row) => [
          row.date,
          row.kid_id,
          row.task_id || "",
          row.chore_title || "",
          row.status || "not-started",
          row.started_at || "",
          row.completed || "FALSE",
          row.completed_at || "",
          row.duration_seconds || "0",
          row.submitted || "FALSE",
          row.note || ""
        ]),
      ...snapshot.activeKids.flatMap((kid) => {
        const tasks = kid.kidId === input.kidId ? updatedRows : snapshot.tasksByKid.get(kid.kidId)?.tasks ?? [];
        return tasks.map((task) => [
          task.date,
          task.kidId,
          task.taskId,
          task.title,
          task.status,
          task.startedAt ?? "",
          String(task.status === "done").toUpperCase(),
          task.completedAt ?? "",
          String(task.durationSeconds),
          String(task.submitted).toUpperCase(),
          task.note
        ]);
      })
    ];

    await writeDailyProgressRows(allRows);
  },
  async submitKidForReview(kidId, date) {
    const taskSet = await this.getTodayTasksForKid(kidId, date);
    const summary = buildTaskSummary(taskSet.tasks);

    if (summary.completedRequiredTasks !== summary.requiredTasks) {
      throw new Error("Finish required chores before submitting for parent review");
    }

    for (const task of taskSet.tasks) {
      await this.updateTaskProgress({
        kidId,
        taskId: task.taskId,
        date: taskSet.date,
        note: task.note
      });
    }

    const rows = taskSet.tasks.map((task) => ({
      ...task,
      submitted: true
    }));

    const snapshot = await buildSheetsSnapshot(taskSet.date);
    const allDailyRows = await readDailyProgressRows();
    const allRows = [
      ["date", "kid_id", "task_id", "chore_title", "status", "started_at", "completed", "completed_at", "duration_seconds", "submitted", "note"],
      ...allDailyRows
        .filter((row) => row.date !== taskSet.date)
        .map((row) => [
          row.date,
          row.kid_id,
          row.task_id || "",
          row.chore_title || "",
          row.status || "not-started",
          row.started_at || "",
          row.completed || "FALSE",
          row.completed_at || "",
          row.duration_seconds || "0",
          row.submitted || "FALSE",
          row.note || ""
        ]),
      ...snapshot.activeKids.flatMap((kid) => {
        const tasks = kid.kidId === kidId ? rows : snapshot.tasksByKid.get(kid.kidId)?.tasks ?? [];
        return tasks.map((task) => [
          task.date,
          task.kidId,
          task.taskId,
          task.title,
          task.status,
          task.startedAt ?? "",
          String(task.status === "done").toUpperCase(),
          task.completedAt ?? "",
          String(task.durationSeconds),
          String(task.submitted).toUpperCase(),
          task.note
        ]);
      })
    ];

    await writeDailyProgressRows(allRows);

    return {
      ...taskSet,
      tasks: rows,
      submitted: true,
      summary: buildTaskSummary(rows)
    };
  },
  async getParentDashboard(date) {
    const snapshot = await buildSheetsSnapshot(date);
    const kids = snapshot.activeKids.map((kid) => {
      const taskSet = snapshot.tasksByKid.get(kid.kidId);
      const tasks = taskSet?.tasks ?? [];
      const summary = buildTaskSummary(tasks);

      return {
        kidId: kid.kidId,
        kidName: kid.name,
        ...summary
      };
    });

    return {
      date: normalizeDateString(date ?? getTodayDateString()),
      kids
    };
  },
  async resetDay(date) {
    const allDailyRows = await readDailyProgressRows();
    const targetDate = normalizeDateString(date ?? getTodayDateString());
    const rows = [
      ["date", "kid_id", "task_id", "chore_title", "status", "started_at", "completed", "completed_at", "duration_seconds", "submitted", "note"],
      ...allDailyRows
        .filter((row) => row.date !== targetDate)
        .map((row) => [
          row.date,
          row.kid_id,
          row.task_id || "",
          row.chore_title || "",
          row.status || "not-started",
          row.started_at || "",
          row.completed || "FALSE",
          row.completed_at || "",
          row.duration_seconds || "0",
          row.submitted || "FALSE",
          row.note || ""
        ])
    ];

    await writeDailyProgressRows(rows);
    return this.getParentDashboard(targetDate);
  }
};

export function getRepository(): Repository {
  return sheetsRepository;
}
