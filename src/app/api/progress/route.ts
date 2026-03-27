import { NextRequest, NextResponse } from "next/server";

import { verifyKidPin } from "@/lib/auth";
import { getRepository } from "@/lib/sheets";

export async function GET() {
  const repository = getRepository();
  const dashboard = await repository.getParentDashboard();
  return NextResponse.json(dashboard);
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    kidId?: string;
    pin?: string;
    quickAccess?: boolean;
    taskId?: string;
    status?: "not-started" | "in-progress" | "done";
    note?: string;
  };

  if (!body.kidId || !body.taskId) {
    return NextResponse.json({ error: "Kid and task are required." }, { status: 400 });
  }

  if (!body.quickAccess) {
    if (!body.pin) {
      return NextResponse.json({ error: "PIN is required." }, { status: 400 });
    }

    const validPin = await verifyKidPin(body.kidId, body.pin);

    if (!validPin) {
      return NextResponse.json({ error: "PIN did not match." }, { status: 401 });
    }
  }

  const repository = getRepository();
  await repository.updateTaskProgress({
    kidId: body.kidId,
    taskId: body.taskId,
    status: body.status,
    note: body.note
  });

  const updated = await repository.getTodayTasksForKid(body.kidId);
  const task = updated.tasks.find((entry) => entry.taskId === body.taskId);

  return NextResponse.json(task);
}
