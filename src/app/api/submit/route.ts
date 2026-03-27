import { NextRequest, NextResponse } from "next/server";

import { verifyKidPin } from "@/lib/auth";
import { getRepository } from "@/lib/sheets";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      kidId?: string;
      pin?: string;
      quickAccess?: boolean;
    };

    if (!body.kidId) {
      return NextResponse.json({ error: "Kid is required." }, { status: 400 });
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
    const result = await repository.submitKidForReview(body.kidId);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit for review.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
