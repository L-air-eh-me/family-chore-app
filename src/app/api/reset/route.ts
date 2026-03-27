import { NextResponse } from "next/server";

import { getRepository } from "@/lib/sheets";

export async function POST() {
  const repository = getRepository();
  const result = await repository.resetDay();

  return NextResponse.json(result);
}
