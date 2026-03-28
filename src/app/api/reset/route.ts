import { NextResponse } from "next/server";

import { getRepository } from "@/lib/sheets";

const noStoreHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate"
};

export async function POST() {
  const repository = getRepository();
  const result = await repository.resetDay();

  return NextResponse.json(result, { headers: noStoreHeaders });
}
