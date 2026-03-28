import { NextResponse } from "next/server";

import { getRepository } from "@/lib/sheets";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const noStoreHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate"
};

export async function GET() {
  const repository = getRepository();
  const kids = await repository.listKids();

  return NextResponse.json(kids, { headers: noStoreHeaders });
}
