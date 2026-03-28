import { NextRequest, NextResponse } from "next/server";

import { verifyKidPin } from "@/lib/auth";
import { getRepository } from "@/lib/sheets";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const noStoreHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate"
};

export async function GET(request: NextRequest) {
  const kidId = request.nextUrl.searchParams.get("kidId");
  const pin = request.nextUrl.searchParams.get("pin");
  const quickAccess = request.nextUrl.searchParams.get("quick") === "1";

  if (!kidId) {
    return NextResponse.json({ error: "Kid is required." }, { status: 400 });
  }

  if (!quickAccess && !pin) {
    return NextResponse.json({ error: "PIN is required." }, { status: 400 });
  }

  if (!quickAccess) {
    const validPin = await verifyKidPin(kidId, pin!);

    if (!validPin) {
      return NextResponse.json({ error: "PIN did not match." }, { status: 401 });
    }
  }

  const repository = getRepository();
  const taskData = await repository.getTodayTasksForKid(kidId);

  return NextResponse.json(taskData, { headers: noStoreHeaders });
}
