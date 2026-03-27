import { NextResponse } from "next/server";

import { getRepository } from "@/lib/sheets";

export async function GET() {
  const repository = getRepository();
  const kids = await repository.listKids();

  return NextResponse.json(kids);
}
